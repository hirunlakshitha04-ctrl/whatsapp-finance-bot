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
  for (const { plan, env } of PLAN_VARIANT_ENV_VARS) {
    const envValue = String(process.env[env] || "").trim();
    if (envValue && envValue === variantId) return plan;
  }
  return "LITE";
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
    const variantId = String(
      attributes?.first_subscription_item?.variant_id || 
      attributes?.variant_id || 
      event.data?.relationships?.variant?.data?.id || ""
    ).trim();

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

      const updateData: Record<string, any> = {
        plan: planName,
        payment_status: "PAID",
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      // Subscription events walata witharai subscription_id eka save karanne
      // order_created event ekata subscription_id ekak thiyenne nathi wela puluwan
      if (subscriptionId) {
        updateData.lemon_squeezy_subscription_id = subscriptionId;
      }
      if (customerId) {
        updateData.lemon_squeezy_customer_id = customerId;
      }

      let query = supabaseAdmin.from("users").update(updateData);

      if (userId) {
        query = query.eq("id", userId);
      } else if (userPhone) {
        query = query.eq("phone_number", userPhone);
      } else if (userEmail) {
        query = query.eq("email", userEmail);
      } else {
        console.error("❌ No user identifier found in webhook payload");
        return NextResponse.json({ error: "User identifier missing" }, { status: 400 });
      }

      const { data, error } = await query.select();

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
      if (isUpgrade && alreadyLinked && upgradeChannel && data && data[0]) {
        await sendUpgradeConfirmation(data[0], planName, upgradeChannel);
      }
    }

    // Subscription Cancelled / Expired Events
    if (
      eventName === "subscription_cancelled" ||
      eventName === "subscription_expired"
    ) {
      const updateData = {
        payment_status: "EXPIRED",
        is_active: false,
        updated_at: new Date().toISOString(),
      };

      let query = supabaseAdmin.from("users").update(updateData);

      if (userId) {
        query = query.eq("id", userId);
      } else if (userPhone) {
        query = query.eq("phone_number", userPhone);
      } else if (userEmail) {
        query = query.eq("email", userEmail);
      }

      await query;
      console.log(`⚠️ Subscription cancelled/expired for user.`);
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