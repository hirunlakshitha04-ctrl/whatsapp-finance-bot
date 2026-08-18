import { NextResponse } from "next/server";
import crypto from "crypto";
import twilio from "twilio";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram-client";

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const TWILIO_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

const PLAN_FEATURE_BLURB: Record<string, string> = {
  CORE: "10 daily logs, 30 monthly scans, 5 daily voice notes, budgets & Excel export",
  MAX: "unlimited logs, scans & voice notes, plus budgets & Excel export",
};

// Sends the "🎉 upgraded!" message directly on whichever channel the user
// was already chatting on — used for the already_linked=true case where no
// redirect/token step is needed (see /api/create-checkout upgrade branch).
async function sendUpgradeConfirmation(user: any, planName: string, channelKey: string) {
  const nickname = user.how_to_call_you || user.nickname || user.name || "Bro";
  const featureBlurb = PLAN_FEATURE_BLURB[planName] || "your new plan features";
  const text = `🎉 Upgraded! Hey ${nickname}, you're now on *${planName}* — ${featureBlurb} are unlocked. Enjoy! 🚀`;

  try {
    if (channelKey === "telegram" && user.telegram_chat_id) {
      await sendTelegramMessage(user.telegram_chat_id, text);
    } else if (channelKey === "whatsapp" && user.phone_number) {
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${user.phone_number}`,
        body: text,
      });
    }
  } catch (err) {
    // Never let a notification failure affect the webhook's success response —
    // the plan is already updated in the DB either way.
    console.error("❌ Upgrade confirmation push failed:", err);
  }
}

// Sends the "your subscription ended, you're back on Lite" message on
// whichever channel the user was chatting on — mirrors sendUpgradeConfirmation.
async function sendDowngradeNotice(user: any, channelKey: string | null) {
  if (!channelKey) return;
  const nickname = user.how_to_call_you || user.nickname || user.name || "Bro";
  const text = `👋 Hey ${nickname}, your subscription has ended and your account is now back on the *LITE* plan. You can resubscribe anytime from your dashboard.`;

  try {
    if (channelKey === "telegram" && user.telegram_chat_id) {
      await sendTelegramMessage(user.telegram_chat_id, text);
    } else if (channelKey === "whatsapp" && user.phone_number) {
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${user.phone_number}`,
        body: text,
      });
    }
  } catch (err) {
    console.error("❌ Downgrade notice push failed:", err);
  }
}

// Every variant ID that should map to a paid plan — channel-specific ones
// first (see /api/create-checkout), then the old channel-agnostic fallback
// env vars for stores that haven't split WhatsApp/Telegram into separate
// variants yet. Whichever one actually has a value set gets checked.
const PLAN_VARIANT_ENV_VARS: { plan: "CORE" | "MAX"; env: string }[] = [
  { plan: "CORE", env: "NEXT_PUBLIC_LEMON_CORE_WHATSAPP_MONTHLY_VARIANT_ID" },
  { plan: "CORE", env: "NEXT_PUBLIC_LEMON_CORE_TELEGRAM_MONTHLY_VARIANT_ID" },
  { plan: "CORE", env: "NEXT_PUBLIC_LEMON_CORE_MONTHLY_VARIANT_ID" }, // fallback
  { plan: "MAX", env: "NEXT_PUBLIC_LEMON_MAX_WHATSAPP_MONTHLY_VARIANT_ID" },
  { plan: "MAX", env: "NEXT_PUBLIC_LEMON_MAX_TELEGRAM_MONTHLY_VARIANT_ID" },
  { plan: "MAX", env: "NEXT_PUBLIC_LEMON_MAX_MONTHLY_VARIANT_ID" }, // fallback
];

function resolvePlanFromVariant(variantId: string): string {
  if (!variantId) return "LITE";

  // Debug trail: dumps exactly what's being compared against what, so a
  // mismatch is diagnosable straight from the Vercel log line instead of
  // requiring dashboard/env digging. Cheap enough to always log.
  const comparisons = PLAN_VARIANT_ENV_VARS.map(({ plan, env }) => {
    const envValue = String(process.env[env] || "").trim();
    return `${env}=${envValue || "(unset)"}`;
  });
  console.log(`🔍 Resolving plan for variantId="${variantId}" against:`, comparisons.join(" | "));

  for (const { plan, env } of PLAN_VARIANT_ENV_VARS) {
    const envValue = String(process.env[env] || "").trim();
    if (envValue && envValue === variantId) return plan;
  }
  return "LITE";
}

// Pulls the variant ID out of whatever shape this event's payload uses.
// Subscription events carry it at attributes.variant_id directly (their
// first_subscription_item only has price_id, not variant_id). Order events
// carry it nested under attributes.first_order_item.variant_id instead —
// this was previously unhandled, so order_created webhooks always fell
// through to relationships.variant.data.id (usually absent) and defaulted
// to LITE regardless of the real variant purchased.
function extractVariantId(attributes: any, eventData: any): string {
  return String(
    attributes?.first_subscription_item?.variant_id ||
    attributes?.first_order_item?.variant_id ||
    attributes?.variant_id ||
    eventData?.relationships?.variant?.data?.id ||
    ""
  ).trim();
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature");
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return NextResponse.json(
        { error: "Missing signature or secret" },
        { status: 400 }
      );
    }

    // Signature Verification
    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(rawBody).digest("hex");

    const signatureBuffer = Buffer.from(signature, "utf8");
    const digestBuffer = Buffer.from(digest, "utf8");

    if (
      signatureBuffer.length !== digestBuffer.length ||
      !crypto.timingSafeEqual(digestBuffer, signatureBuffer)
    ) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventName = event.meta?.event_name;
    const customData = event.meta?.custom_data;
    const attributes = event.data?.attributes;

    // User Email සහ Phone Number ලබා ගැනීම — "email" is the key our
    // /api/create-checkout route actually sets in checkoutData.custom;
    // user_email/customer_email are kept as fallbacks for other payload shapes.
    const userEmail =
      customData?.email || customData?.user_email || attributes?.user_email || attributes?.customer_email;
    const userPhone = customData?.phone;

    // Upgrade-flow fields — set by /api/create-checkout when mode=upgrade.
    // user_id is the most reliable lookup key (works even when phone/telegram
    // aren't linked yet), and already_linked tells us whether to push a
    // direct chat confirmation or leave it to the payment-success redirect.
    const userId = customData?.user_id;
    const isUpgrade = customData?.mode === "upgrade";
    const alreadyLinked = customData?.already_linked === "true";
    const upgradeChannel = customData?.channel;

    // Variant ID එක Lemon Squeezy payloads වල එන විවිධ තැන්වලින් ලබා ගැනීමට
    const variantId = extractVariantId(attributes, event.data);

    // Subscription ID එක - Method 2 (pre-authenticated customer portal link) ekata one karana eka
    // meka witharai save karanne, urls.customer_portal URL eka nemei (eka 24h eken expire wenawa)
    const subscriptionId = event.data?.id || "";

    console.log(`⚡ Webhook Event: ${eventName} | Email: ${userEmail} | Variant ID: ${variantId}`);

    // Subscription Created / Updated / Order Created Events
    if (
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "order_created"
    ) {
      const planName = resolvePlanFromVariant(variantId);
      if (planName === "LITE") {
        console.warn(`⚠️ Warning: Received Variant ID (${variantId}) did not match any configured environment variable. Defaulting to LITE.`);
      }

      const customerId = attributes?.customer_id ? String(attributes.customer_id) : "";

      // custom_data.channel is set by /api/create-checkout in both the
      // fresh-registration and upgrade branches, so this reliably stamps
      // whichever channel this payment/upgrade was made on as the user's
      // single active channel (see the WhatsApp/Telegram routes' block).
      const paymentChannel = customData?.channel === "telegram" ? "telegram" : customData?.channel === "whatsapp" ? "whatsapp" : null;

      const updateData: Record<string, any> = {
        plan: planName,
        payment_status: "PAID",
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      if (paymentChannel) {
        updateData.active_channel = paymentChannel;
      }

      // Subscription events walata witharai subscription_id eka save karanne
      // order_created event ekata subscription_id ekak thiyenne nathi wela puluwan
      if (subscriptionId) {
        updateData.lemon_squeezy_subscription_id = subscriptionId;
      }
      if (customerId) {
        updateData.lemon_squeezy_customer_id = customerId;
      }

      // Build the identity filter once, reused by both update attempts below.
      const applyIdentityFilter = (q: any) => {
        if (userId) return q.eq("id", userId);
        if (userPhone) return q.eq("phone_number", userPhone);
        if (userEmail) return q.eq("email", userEmail);
        return null;
      };

      if (!userId && !userPhone && !userEmail) {
        console.error("❌ No user identifier found in webhook payload");
        return NextResponse.json({ error: "User identifier missing" }, { status: 400 });
      }

      // Idempotency guard against duplicate/concurrent webhook deliveries
      // (Lemon Squeezy commonly fires subscription_created AND
      // subscription_updated for the same purchase, sometimes almost
      // simultaneously). Filtering this UPDATE on plan != planName makes it
      // race-safe: Postgres serializes concurrent UPDATEs to the same row
      // via row-level locking and re-checks the WHERE clause against the
      // just-committed value, so only ONE of several concurrent requests
      // actually matches and updates the row — the rest match zero rows.
      // Only the request that wins this race sends the chat confirmation.
      const atomicQuery = applyIdentityFilter(supabaseAdmin.from("users").update(updateData))!.neq("plan", planName);
      let { data, error } = await atomicQuery.select();
      let planActuallyChanged = !error && !!data && data.length > 0;

      if (!error && (!data || data.length === 0)) {
        // Zero rows matched — either a duplicate delivery (plan already
        // planName, expected and fine) or a genuine same-plan renewal that
        // still needs payment_status/subscription_id/customer_id refreshed.
        // Do a plain update (no neq filter, no confirmation) to cover the
        // renewal case; harmless no-op write for the duplicate case.
        const fallbackQuery = applyIdentityFilter(supabaseAdmin.from("users").update(updateData))!;
        const fallbackResult = await fallbackQuery.select();
        data = fallbackResult.data;
        error = fallbackResult.error;
        console.log(`ℹ️ Plan already "${planName}" or renewal — skipping duplicate upgrade confirmation (event: ${eventName}).`);
      }

      if (error) {
        console.error("Supabase Update Error:", error);
        return NextResponse.json(
          { error: "Database update failed", details: error.message },
          { status: 500 }
        );
      }

      console.log(`✅ Successfully updated user to plan: ${planName}`, data);

      // Same-channel upgrade (e.g. WhatsApp Lite -> WhatsApp Core): the user
      // never leaves the chat, so push the confirmation directly instead of
      // relying on the payment-success page to redirect them anywhere.
      // Gated on the atomic race check above so duplicate/concurrent
      // webhook events for the same purchase don't spam the same message.
      if (isUpgrade && alreadyLinked && upgradeChannel && planActuallyChanged && data && data[0]) {
        await sendUpgradeConfirmation(data[0], planName, upgradeChannel);
      }
    }

    // Subscription Cancelled / Expired Events
    if (
      eventName === "subscription_cancelled" ||
      eventName === "subscription_expired"
    ) {
      const applyIdentityFilter = (q: any) => {
        if (userId) return q.eq("id", userId);
        if (userPhone) return q.eq("phone_number", userPhone);
        if (userEmail) return q.eq("email", userEmail);
        return null;
      };

      if (!userId && !userPhone && !userEmail) {
        console.error("❌ No user identifier found in cancel/expire webhook payload");
        return NextResponse.json({ error: "User identifier missing" }, { status: 400 });
      }

      const updateData = {
        plan: "LITE",
        payment_status: "EXPIRED",
        is_active: false,
        active_channel: null,
        updated_at: new Date().toISOString(),
      };

      // Grab the pre-update row (channel + contact info) BEFORE nulling
      // active_channel, so we still know where to send the downgrade notice.
      const preUpdateQuery = applyIdentityFilter(
        supabaseAdmin
          .from("users")
          .select("active_channel, telegram_chat_id, phone_number, how_to_call_you, nickname, name, plan")
      )!;
      const { data: preRows } = await preUpdateQuery;
      const preRow = preRows && preRows[0];

      // Idempotency: only downgrade (and notify) if not already on LITE —
      // same race-safe pattern as the paid-plan branch above, so duplicate
      // cancelled+expired deliveries for the same subscription don't double-fire.
      const atomicQuery = applyIdentityFilter(supabaseAdmin.from("users").update(updateData))!.neq("plan", "LITE");
      const { data, error } = await atomicQuery.select();

      if (error) {
        console.error("Supabase Cancel/Expire Update Error:", error);
        return NextResponse.json(
          { error: "Database update failed", details: error.message },
          { status: 500 }
        );
      }

      const planActuallyChanged = !!data && data.length > 0;
      console.log(`⚠️ Subscription ${eventName} — plan set to LITE: ${planActuallyChanged}`);

      if (planActuallyChanged && preRow) {
        await sendDowngradeNotice(preRow, preRow.active_channel);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook Handler Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 }
    );
  }
}