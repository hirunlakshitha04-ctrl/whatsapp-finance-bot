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
    console.error("❌ Upgrade confirmation push failed:", err);
  }
}

const PLAN_VARIANT_ENV_VARS: { plan: "CORE" | "MAX"; env: string }[] = [
  { plan: "CORE", env: "NEXT_PUBLIC_LEMON_CORE_WHATSAPP_MONTHLY_VARIANT_ID" },
  { plan: "CORE", env: "NEXT_PUBLIC_LEMON_CORE_TELEGRAM_MONTHLY_VARIANT_ID" },
  { plan: "CORE", env: "NEXT_PUBLIC_LEMON_CORE_MONTHLY_VARIANT_ID" },
  { plan: "MAX", env: "NEXT_PUBLIC_LEMON_MAX_WHATSAPP_MONTHLY_VARIANT_ID" },
  { plan: "MAX", env: "NEXT_PUBLIC_LEMON_MAX_TELEGRAM_MONTHLY_VARIANT_ID" },
  { plan: "MAX", env: "NEXT_PUBLIC_LEMON_MAX_MONTHLY_VARIANT_ID" },
];

function resolvePlanFromVariant(variantId: string): string {
  if (!variantId) return "LITE";

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

    const userEmail =
      customData?.email || customData?.user_email || attributes?.user_email || attributes?.customer_email;
    const userPhone = customData?.phone;

    const userId = customData?.user_id;
    const isUpgrade = customData?.mode === "upgrade";
    const alreadyLinked = customData?.already_linked === "true";
    const upgradeChannel = customData?.channel;

    const variantId = extractVariantId(attributes, event.data);
    const subscriptionId = event.data?.id || "";

    console.log(`⚡ Webhook Event: ${eventName} | Email: ${userEmail} | Variant ID: ${variantId}`);

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

      if (subscriptionId) {
        updateData.lemon_squeezy_subscription_id = subscriptionId;
      }
      if (customerId) {
        updateData.lemon_squeezy_customer_id = customerId;
      }

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

      const atomicQuery = applyIdentityFilter(supabaseAdmin.from("users").update(updateData))!.neq("plan", planName);
      let { data, error } = await atomicQuery.select();
      let planActuallyChanged = !error && !!data && data.length > 0;

      if (!error && (!data || data.length === 0)) {
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

      if (isUpgrade && alreadyLinked && upgradeChannel && planActuallyChanged && data && data[0]) {
        await sendUpgradeConfirmation(data[0], planName, upgradeChannel);
      }
    }

    // Subscription Cancelled / Expired Events
    if (
      eventName === "subscription_cancelled" ||
      eventName === "subscription_expired"
    ) {
      // 🔧 FIX: previously only set payment_status/is_active — `plan`
      // stayed at "CORE"/"MAX" forever, so a cancelled/expired subscriber
      // kept full paid-tier access on WhatsApp/Telegram (those routes only
      // check `plan`, not payment_status/is_active). Downgrading to LITE
      // here is what actually restores the daily limits.
      const updateData = {
        plan: "LITE",
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
      console.log(`⚠️ Subscription cancelled/expired for user — downgraded to LITE.`);
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