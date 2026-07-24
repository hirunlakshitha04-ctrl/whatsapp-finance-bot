import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// 🔒 Admin Privileges ඇති Service Role Client එක (RLS Bypass කිරීම සඳහා)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";

    // 1. Signature Verification (Security Check)
    if (webhookSecret) {
      const hmac = crypto.createHmac("sha256", webhookSecret);
      const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
      const signatureBuffer = Buffer.from(signature, "utf8");

      if (
        digest.length !== signatureBuffer.length ||
        !crypto.timingSafeEqual(digest, signatureBuffer)
      ) {
        console.error("❌ Invalid LemonSqueezy Signature");
        return new NextResponse("Invalid signature", { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventName = event.meta?.event_name;
    const customData = event.meta?.custom_data;

    // LemonSqueezy Checkout එකෙන් Passthrough මගින් එවූ Phone Number එක ලබා ගැනීම
    const phoneNumber = customData?.phone;

    console.log(`📩 LemonSqueezy Event Received: ${eventName}`);

    // Phone number format එක නිරවුල් කිරීම (+947xxxxxxx)
    let cleanedPhone = phoneNumber?.replace(/[^0-9+]/g, "");
    if (cleanedPhone && !cleanedPhone.startsWith("+")) {
      cleanedPhone = `+${cleanedPhone}`;
    }

    // 2. Order Or Subscription Success Events Processing
    if (
      eventName === "order_created" ||
      eventName === "subscription_created" ||
      eventName === "subscription_updated"
    ) {
      const attributes = event.data?.attributes;
      const status = attributes?.status;
      // LemonSqueezy එකෙන් ලැබෙන Next Renewal Date එක (ISO string)
      const renewsAt = attributes?.renews_at;

      // Payment එක Paid / Active නම් DB එක Update කිරීම
      if (status === "paid" || status === "active" || status === "on_trial") {
        if (cleanedPhone) {
          const { error } = await supabaseAdmin
            .from("users")
            .update({
              is_paid: true,
              subscription_status: "active",
              subscription_ends_at: renewsAt || null,
              lemonsqueezy_customer_id: String(attributes?.customer_id || ""),
              lemonsqueezy_subscription_id: String(event.data?.id || ""),
            })
            .eq("phone_number", cleanedPhone);

          if (error) {
            console.error("❌ DB Update Error (LemonSqueezy):", error);
          } else {
            console.log(`✅ User Updated to Paid: ${cleanedPhone}`);
          }
        } else {
          console.warn("⚠️ Event received but no phone number found in custom_data");
        }
      }
    }

    // 3. Subscription Expired or Cancelled Events Processing
    if (
      eventName === "subscription_expired" ||
      eventName === "subscription_cancelled" ||
      eventName === "subscription_unpaid"
    ) {
      if (cleanedPhone) {
        const { error } = await supabaseAdmin
          .from("users")
          .update({
            is_paid: false,
            subscription_status: "expired",
          })
          .eq("phone_number", cleanedPhone);

        if (error) {
          console.error("❌ DB Update Error on Expiry:", error);
        } else {
          console.log(`🛑 User Subscription Expired: ${cleanedPhone}`);
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    console.error("❌ LemonSqueezy Webhook Error:", error);
    return new NextResponse("Webhook error", { status: 500 });
  }
}