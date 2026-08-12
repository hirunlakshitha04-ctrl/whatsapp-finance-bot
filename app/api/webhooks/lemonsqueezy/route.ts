import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

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

    // User Email සහ Phone Number ලබා ගැනීම
    const userEmail =
      customData?.user_email || attributes?.user_email || attributes?.customer_email;
    const userPhone = customData?.phone;

    // Variant ID එක Lemon Squeezy payloads වල එන විවිධ තැන්වලින් ලබා ගැනීමට
    const variantId = String(
      attributes?.first_subscription_item?.variant_id || 
      attributes?.variant_id || 
      event.data?.relationships?.variant?.data?.id || ""
    ).trim();

    console.log(`⚡ Webhook Event: ${eventName} | Email: ${userEmail} | Variant ID: ${variantId}`);

    // Subscription Created / Updated / Order Created Events
    if (
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "order_created"
    ) {
      let planName = "LITE"; // Default

      const coreVariantId = String(process.env.NEXT_PUBLIC_LEMON_CORE_MONTHLY_VARIANT_ID || "").trim();
      const maxVariantId = String(process.env.NEXT_PUBLIC_LEMON_MAX_MONTHLY_VARIANT_ID || "").trim();

      if (variantId && variantId === maxVariantId) {
        planName = "MAX";
      } else if (variantId && variantId === coreVariantId) {
        planName = "CORE";
      } else {
        console.warn(`⚠️ Warning: Received Variant ID (${variantId}) did not match configured environment variables. Defaulting to LITE.`);
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

      if (userPhone) {
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