import { NextResponse } from "next/server";
import crypto from "crypto";
import twilio from "twilio";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram-client";

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const TWILIO_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

const PLAN_PRICE_ENV_VARS: { plan: "CORE" | "MAX"; env: string }[] = [
  { plan: "CORE", env: "NEXT_PUBLIC_PADDLE_CORE_WHATSAPP_MONTHLY_PRICE_ID" },
  { plan: "CORE", env: "NEXT_PUBLIC_PADDLE_CORE_TELEGRAM_MONTHLY_PRICE_ID" },
  { plan: "CORE", env: "NEXT_PUBLIC_PADDLE_CORE_MONTHLY_PRICE_ID" },
  { plan: "MAX", env: "NEXT_PUBLIC_PADDLE_MAX_WHATSAPP_MONTHLY_PRICE_ID" },
  { plan: "MAX", env: "NEXT_PUBLIC_PADDLE_MAX_TELEGRAM_MONTHLY_PRICE_ID" },
  { plan: "MAX", env: "NEXT_PUBLIC_PADDLE_MAX_MONTHLY_PRICE_ID" },
];

const PLAN_FEATURE_BLURB: Record<string, string> = {
  CORE: "10 daily logs, 30 monthly scans, 5 daily voice notes, budgets & Excel export",
  MAX: "unlimited logs, scans & voice notes, plus budgets & Excel export",
};

function resolvePlanFromPrice(priceId: string) {
  const id = String(priceId || "").trim();
  for (const { plan, env } of PLAN_PRICE_ENV_VARS) {
    const configured = String(process.env[env] || "").trim();
    if (configured && configured === id) return plan;
  }
  return "LITE";
}

async function sendUpgradeConfirmation(user: any, planName: string, channelKey: string) {
  const nickname = user.how_to_call_you || user.nickname || user.name || "Bro";
  const featureBlurb = PLAN_FEATURE_BLURB[planName] || "your new plan features";
  const text = `🎉 Upgraded! Hey ${nickname}, you're now on *${planName}* — ${featureBlurb} are unlocked. Enjoy! 🚀`;
  try {
    if (channelKey === "telegram" && user.telegram_chat_id) {
      await sendTelegramMessage(user.telegram_chat_id, text);
    } else if (channelKey === "whatsapp" && user.phone_number) {
      await twilioClient.messages.create({ from: TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${user.phone_number}`, body: text });
    }
  } catch (err) {
    console.error("Upgrade confirmation push failed:", err);
  }
}

function verifyPaddleSignature(rawBody: string, signature: string, secret: string) {
  const parts = signature.split(";");
  const ts = parts.find((part) => part.startsWith("ts="))?.slice(3);
  const h1 = parts.find((part) => part.startsWith("h1="))?.slice(3);
  if (!ts || !h1) return false;

  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 5 * 60) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(h1, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function paddleRequest(path: string, init: RequestInit = {}) {
  const environment = (process.env.PADDLE_ENVIRONMENT || "production").toLowerCase();
  const baseUrl = environment === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
}

function identityQuery(customData: any, attributes: any) {
  const userId = customData?.user_id;
  const userPhone = customData?.phone;
  const userEmail = customData?.email || attributes?.customer?.email;
  return { userId, userPhone, userEmail };
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("paddle-signature");
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!signature || !secret) return NextResponse.json({ error: "Missing Paddle signature or secret" }, { status: 400 });
    if (!verifyPaddleSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventName = String(event?.event_type || event?.name || "");
    const data = event?.data || {};
    const customData = data?.custom_data || {};
    const { userId, userPhone, userEmail } = identityQuery(customData, data);
    const subscriptionId = String(data?.id || data?.subscription_id || "").trim();
    const customerId = String(data?.customer_id || data?.customer?.id || "").trim();

    console.log(`Paddle webhook: ${eventName} | id=${data?.id || ""} | customer=${customerId} | user=${userId || userEmail || userPhone || "unknown"}`);

    const shouldProvision =
      eventName === "transaction.completed" ||
      eventName === "subscription.created" ||
      eventName === "subscription.activated" ||
      eventName === "subscription.resumed" ||
      (eventName === "subscription.updated" && ["active", "trialing"].includes(String(data?.status || "")));

    if (shouldProvision) {
      const item = Array.isArray(data?.items) ? data.items[0] : null;
      const priceId = item?.price?.id || item?.price_id || "";
      const planName = resolvePlanFromPrice(priceId);
      const status = String(data?.status || "active");
      if (planName === "LITE" && eventName !== "transaction.completed") {
        console.warn("Unknown Paddle price ID; leaving plan unchanged:", priceId);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const paymentChannel = customData?.channel === "telegram" ? "telegram" : customData?.channel === "whatsapp" ? "whatsapp" : null;
      const updateData: Record<string, any> = {
        plan: planName,
        payment_status: "PAID",
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      if (paymentChannel) updateData.active_channel = paymentChannel;
      if (eventName === "subscription.created" || eventName === "transaction.completed") {
        updateData.plan_activated_at = new Date().toISOString();
      }
      if (subscriptionId && subscriptionId.startsWith("sub_")) updateData.paddle_subscription_id = subscriptionId;
      if (customerId && customerId.startsWith("ctm_")) updateData.paddle_customer_id = customerId;
      if (data?.next_billed_at) updateData.subscription_renews_at = data.next_billed_at;
      else if (data?.current_billing_period?.ends_at) updateData.subscription_renews_at = data.current_billing_period.ends_at;

      const applyIdentityFilter = (q: any) => {
        if (userId) return q.eq("id", userId);
        if (userPhone) return q.eq("phone_number", userPhone);
        if (userEmail) return q.eq("email", userEmail);
        return null;
      };
      if (!userId && !userPhone && !userEmail) {
        console.error("Paddle webhook has no user identifier", customData);
        return NextResponse.json({ error: "User identifier missing" }, { status: 400 });
      }

      let previousSubscriptionId: string | null = null;
      if (customData?.mode === "upgrade") {
        const q = applyIdentityFilter(supabaseAdmin.from("users").select("paddle_subscription_id"));
        if (q) {
          const { data: row } = await q.maybeSingle();
          previousSubscriptionId = row?.paddle_subscription_id || null;
        }
      }

      const updateQuery = applyIdentityFilter(supabaseAdmin.from("users").update(updateData));
      if (!updateQuery) return NextResponse.json({ error: "User identifier missing" }, { status: 400 });
      const { data: updatedRows, error } = await updateQuery.select();
      if (error) {
        console.error("Supabase Paddle update error:", error);
        return NextResponse.json({ error: "Database update failed", details: error.message }, { status: 500 });
      }

      const changed = !!updatedRows?.length;
      console.log(`Paddle subscription provisioned: ${planName}`, updatedRows?.[0]?.id || "");

      if (previousSubscriptionId && subscriptionId && previousSubscriptionId !== subscriptionId && previousSubscriptionId.startsWith("sub_")) {
        try {
          const cancelRes = await paddleRequest(`/subscriptions/${previousSubscriptionId}/cancel`, {
            method: "POST",
            body: JSON.stringify({}),
          });
          if (!cancelRes.ok) console.error("Could not cancel previous Paddle subscription:", await cancelRes.text());
        } catch (err) {
          console.error("Error cancelling previous Paddle subscription:", err);
        }
      }

      if (customData?.mode === "upgrade" && customData?.already_linked === "true" && paymentChannel && changed && updatedRows?.[0]) {
        await sendUpgradeConfirmation(updatedRows[0], planName, paymentChannel);
      }
    }

    if (["subscription.canceled", "subscription.paused", "subscription.past_due"].includes(eventName)) {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (eventName === "subscription.canceled") {
        updateData.plan = "LITE";
        updateData.payment_status = "EXPIRED";
        updateData.is_active = false;
        updateData.subscription_renews_at = null;
      } else if (eventName === "subscription.paused") {
        updateData.payment_status = "PAUSED";
        updateData.is_active = false;
      } else {
        updateData.payment_status = "PAST_DUE";
        updateData.is_active = false;
      }

      let query: any = supabaseAdmin.from("users").update(updateData);
      if (customData?.user_id) query = query.eq("id", customData.user_id);
      else if (customData?.phone) query = query.eq("phone_number", customData.phone);
      else if (data?.customer?.email) query = query.eq("email", data.customer.email);
      else if (data?.customer_id) query = query.eq("paddle_customer_id", data.customer_id);
      else return NextResponse.json({ error: "User identifier missing" }, { status: 400 });

      const { error } = await query;
      if (error) console.error("Paddle lifecycle update failed:", error);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Paddle webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed", details: error?.message }, { status: 500 });
  }
}
