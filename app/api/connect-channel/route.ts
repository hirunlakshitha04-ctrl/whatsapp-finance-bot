import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ---------------------------------------------------------------------------
// CONNECT / RECONNECT / CHANGE-NUMBER endpoint (called from the dashboard)
//
// Registration auto-redirects the user to WhatsApp or Telegram exactly once.
// If they close that tab, open WhatsApp on a phone with a different number,
// or simply never send the first message, they end up with an account that
// has NO chat attached and — until now — no way back.
//
// This route is the way back. It mints a fresh one-time `link_token` on the
// caller's own user row and hands back a deep link:
//
//   WhatsApp → https://wa.me/<bot>?text=START-<token>
//   Telegram → https://t.me/<bot>?start=<token>
//
// Both bot webhooks already know how to consume that token and attach the
// incoming chat to the existing row (see the "START-" branch in
// app/api/whatsapp/route.ts and the "/start" branch in app/api/telegram/route.ts),
// so no bot-side protocol change is needed.
//
// Changing a WhatsApp number works through the SAME path on purpose: we save
// the new number here, and the token link makes the bot re-attach `from` (the
// number the message actually arrives from) to this row. That means a typo in
// the dashboard self-corrects — whatever number sends START- wins.
// ---------------------------------------------------------------------------

type Channel = "whatsapp" | "telegram";

// Same normalisation the register page applies, kept in sync deliberately:
// a leading 0 is treated as a Sri Lankan local number, anything else is
// assumed to already carry its country code.
function normalizePhone(raw: string): string {
  let cleaned = raw.trim().replace(/[^0-9+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("0")) {
    cleaned = "+94" + cleaned.slice(1);
  } else if (!cleaned.startsWith("+")) {
    cleaned = `+${cleaned}`;
  }
  return cleaned;
}

function isPlausiblePhone(phone: string): boolean {
  // E.164: '+' then 8–15 digits. Deliberately loose — Twilio is the real
  // authority, this only catches obvious junk before we save it.
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

async function authenticate(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

// GET — current connection status, used by the dashboard to decide whether to
// show "Connect" or "Connected", and polled after the user comes back from
// the chat app so the badge flips without a manual refresh.
export async function GET(req: Request) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: row } = await supabaseAdmin
      .from("users")
      .select(
        "phone_number, telegram_chat_id, active_channel, whatsapp_connected_at, plan, payment_status, is_active, plan_activated_at"
      )
      .eq("id", user.id)
      .maybeSingle();

    const telegramConnected = !!row?.telegram_chat_id;
    // A saved phone number is NOT proof of a connection — registration stores
    // it before the user ever opens WhatsApp. Only an actual inbound message
    // (which stamps whatsapp_connected_at) counts.
    const whatsappConnected = !!row?.whatsapp_connected_at;
    const isPaidUser =
      !!row?.plan && row.plan.toLowerCase() !== "lite" && row.payment_status === "PAID" && row.is_active === true;

    const GRACE_PERIOD_DAYS = 14;
    let graceDaysLeft = 0;
    if (isPaidUser && row?.plan_activated_at) {
      const daysSince = (Date.now() - new Date(row.plan_activated_at).getTime()) / (1000 * 60 * 60 * 24);
      graceDaysLeft = Math.max(0, Math.ceil(GRACE_PERIOD_DAYS - daysSince));
    }

    return NextResponse.json({
      phone: row?.phone_number || "",
      whatsapp_connected: whatsappConnected,
      telegram_connected: telegramConnected,
      active_channel: row?.active_channel || null,
      connected: whatsappConnected || telegramConnected,
      plan: row?.plan || "LITE",
      is_paid: isPaidUser,
      grace_days_left: graceDaysLeft,
    });
  } catch (error: any) {
    console.error("connect-channel GET error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST — mint a link token (optionally saving a new WhatsApp number first)
// and return the deep link the dashboard should open.
export async function POST(req: Request) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const channel: Channel = body?.channel === "telegram" ? "telegram" : "whatsapp";
    const rawPhone = typeof body?.phone === "string" ? body.phone : "";

    const { data: currentRow, error: rowError } = await supabaseAdmin
      .from("users")
      .select("id, phone_number, telegram_chat_id, plan, payment_status, is_active, active_channel, plan_activated_at")
      .eq("id", user.id)
      .maybeSingle();

    if (rowError || !currentRow) {
      return NextResponse.json(
        { error: "We couldn't find your profile. Please sign out and sign in again." },
        { status: 404 }
      );
    }

    // -------------------------------------------------------------------
    // 14-DAY FREE-SWITCH GRACE PERIOD
    //
    // Right after ANY payment (first signup or a previous channel switch),
    // a user gets 14 days to change their mind and switch channel again for
    // free. Without this, someone who pays for WhatsApp and realizes the
    // very next day they actually wanted Telegram would be charged twice in
    // the same week for what's really just a quick correction — a bad first
    // experience with a brand-new paying customer.
    //
    // plan_activated_at is stamped by the Lemon Squeezy webhook on every
    // genuinely NEW subscription/order (not renewals), so this naturally
    // resets each time they pay for a switch — giving 14 fresh days to
    // settle on the right channel after THAT payment too, not just the
    // original signup.
    const GRACE_PERIOD_DAYS = 14;
    const activatedAt = currentRow.plan_activated_at ? new Date(currentRow.plan_activated_at) : null;
    const daysSinceActivation = activatedAt
      ? (Date.now() - activatedAt.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity; // no timestamp on record (e.g. pre-migration account) — treat as grace period over, the safe default
    const inGracePeriod = daysSinceActivation <= GRACE_PERIOD_DAYS;

    // -------------------------------------------------------------------
    // PAID CHANNEL SWITCH REQUIRES PAYMENT
    //
    // WhatsApp and Telegram are priced differently for Core/Max (see
    // create-checkout's VARIANT_ENV_MAP), so a paid user moving from one
    // channel to the other is a genuine plan change, not just "reconnecting
    // my chat" — it must go through checkout so the correct price applies.
    //
    // This does NOT block:
    //   - reconnecting the SAME channel they're already paying for
    //     (active_channel === requested channel) — e.g. their first connect
    //     attempt failed, or the bot got blocked and they need to /start again
    //   - changing their WhatsApp NUMBER while staying on WhatsApp — still
    //     the same channel, so still free
    //   - anything for a free/LITE user — channel is unrestricted for them
    //   - a paid user who has never connected any channel yet
    //     (active_channel is null) — nothing to "switch" away from
    //   - a paid user still within their 14-day grace period after payment
    const isPaidUser =
      !!currentRow.plan &&
      currentRow.plan.toLowerCase() !== "lite" &&
      currentRow.payment_status === "PAID" &&
      currentRow.is_active === true;

    const isGenuineChannelSwitch =
      isPaidUser && !!currentRow.active_channel && currentRow.active_channel !== channel && !inGracePeriod;

    if (isGenuineChannelSwitch) {
      return NextResponse.json(
        {
          error: `Switching from ${currentRow.active_channel} to ${channel} needs a new checkout, since they're priced differently on your plan.`,
          upgradeRequired: true,
          plan: currentRow.plan,
          fromChannel: currentRow.active_channel,
          toChannel: channel,
        },
        { status: 402 }
      );
    }

    const updates: Record<string, any> = {};
    let phoneToUse = currentRow.phone_number || "";

    if (channel === "whatsapp") {
      if (rawPhone.trim()) {
        const normalized = normalizePhone(rawPhone);

        if (!isPlausiblePhone(normalized)) {
          return NextResponse.json(
            { error: "That doesn't look like a valid WhatsApp number. Include your country code, e.g. +94771234567." },
            { status: 400 }
          );
        }

        // One number, one account. Checked with the service-role client
        // because RLS hides other users' rows from the browser — without
        // this the duplicate would only surface as a raw 23505 constraint
        // error from the bot webhook, long after the user left the page.
        if (normalized !== currentRow.phone_number) {
          const { data: clash } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("phone_number", normalized)
            .neq("id", currentRow.id)
            .maybeSingle();

          if (clash) {
            return NextResponse.json(
              { error: "That WhatsApp number is already linked to another account. Please use a different number." },
              { status: 409 }
            );
          }
        }

        updates.phone_number = normalized;
        phoneToUse = normalized;
      }

      if (!phoneToUse) {
        return NextResponse.json(
          { error: "Please enter your WhatsApp number first." },
          { status: 400 }
        );
      }
    }

    // Fresh token on every request. These are single-use — both webhooks null
    // out link_token the moment they consume it — so an abandoned link simply
    // becomes dead rather than staying valid forever.
    const linkToken =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    updates.link_token = linkToken;

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", currentRow.id);

    if (updateError) {
      console.error("connect-channel update error:", updateError);
      // 23505 = unique violation, i.e. the number was taken between our
      // duplicate check above and this write.
      if (updateError.code === "23505") {
        return NextResponse.json(
          { error: "That WhatsApp number is already linked to another account." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Could not save your details. Please try again." }, { status: 500 });
    }

    let url: string;
    if (channel === "telegram") {
      const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "your_bot_username";
      url = `https://t.me/${botUsername}?start=${linkToken}`;
    } else {
      const botPhoneNumber = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "+94764775963";
      const cleanNumber = botPhoneNumber.replace("whatsapp:", "").replace("+", "");
      url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(`START-${linkToken}`)}`;
    }

    return NextResponse.json({ url, phone: phoneToUse, channel });
  } catch (error: any) {
    console.error("connect-channel POST error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
