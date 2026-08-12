import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature");
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    // 1. Webhook Signature එක පරික්ෂා කිරීම
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

    // User Email සහ Phone Number ලබා ගැනීම
    const userEmail =
      customData?.user_email || attributes?.user_email || attributes?.customer_email;
    const userPhone = customData?.phone;

    // Variant ID එක ලබා ගැනීම
    const variantId = String(
      attributes?.first_subscription_item?.variant_id || attributes?.variant_id || ""
    );

    console.log(`⚡ Lemon Squeezy Event Received: ${eventName} for ${userEmail || userPhone}`);

    // 2. Subscription Created / Updated / Order Created Events (Payment Success)
    if (
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "order_created"
    ) {
      // Plan Name එක LITE, CORE, MAX ලෙස නිවැරදි කිරීම
      let planName = "LITE"; // Default එක LITE ලෙස සැකීම

      if (variantId === process.env.NEXT_PUBLIC_LEMON_CORE_MONTHLY_VARIANT_ID) {
        planName = "CORE";
      } else if (variantId === process.env.NEXT_PUBLIC_LEMON_MAX_MONTHLY_VARIANT_ID) {
        planName = "MAX";
      }

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
      } else {
        console.error("❌ No user email or phone found in webhook payload");
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
  } catch (error: any) {
    console.error("Webhook Handler Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 }
    );
  }
}