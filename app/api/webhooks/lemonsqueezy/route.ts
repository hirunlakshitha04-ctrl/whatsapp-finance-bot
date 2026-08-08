import { NextResponse } from "next/server";
import crypto from "crypto";
// Relative path භාවිතයෙන් supabaseAdmin import කිරීම
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature");
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    // 1. Webhook Signature එක පරික්ෂා කිරීම (Security Check)
    if (!signature || !secret) {
      return NextResponse.json(
        { error: "Missing signature or secret" },
        { status: 400 }
      );
    }

    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (!crypto.timingSafeEqual(digest, signatureBuffer)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventName = event.meta?.event_name;
    const customData = event.meta?.custom_data;
    const attributes = event.data?.attributes;

    // User Email සහ Phone Number ලබා ගැනීම
    const userEmail =
      customData?.user_email || attributes?.user_email || attributes?.customer_email;
    const userPhone = customData?.phone;

    // Variant ID එක ලබා ගැනීම
    const variantId = String(
      attributes?.first_subscription_item?.variant_id || attributes?.variant_id
    );

    console.log(`⚡ Lemon Squeezy Event Received: ${eventName} for ${userEmail || userPhone}`);

    // 2. Subscription Created / Updated / Order Created Events (Payment Success)
    if (
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "order_created"
    ) {
      // Variant ID එක අනුව Plan Name එක තීරණය කිරීම
      let planName = "CORE";

      if (variantId === process.env.NEXT_PUBLIC_LEMON_PRO_MONTHLY_VARIANT_ID) {
        planName = "MAX";
      } else if (variantId === process.env.NEXT_PUBLIC_LEMON_ORBIT_MONTHLY_VARIANT_ID) {
        planName = "ORBIT";
      }

      // Supabase DB Update කිරීම
      const updateData = {
        plan: planName,
        payment_status: "PAID",
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      let query = supabaseAdmin.from("users").update(updateData);

      if (userPhone) {
        query = query.eq("phone_number", userPhone);
      } else if (userEmail) {
        query = query.eq("email", userEmail);
      }

      const { error } = await query;

      if (error) {
        console.error("Supabase Update Error:", error);
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        );
      }

      console.log(`✅ Successfully updated user to plan: ${planName}, payment_status: PAID, is_active: true`);
    }

    // 3. Subscription Cancelled / Expired Events
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

      if (userPhone) {
        query = query.eq("phone_number", userPhone);
      } else if (userEmail) {
        query = query.eq("email", userEmail);
      }

      await query;

      console.log(`⚠️ Subscription cancelled/expired for user. Updated is_active to false.`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook Handler Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}