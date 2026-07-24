import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

// Supabase Service Role Client (RLS Bypass කිරීමට)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Twilio Client Setup
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function GET(req: NextRequest) {
  try {
    // 1. 🔒 Security Verification
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. 📅 මීළඟ දවස් 3 ඇතුළත Renewal එක තියෙන දින පරාසය Calculate කිරීම
    const now = new Date();
    const targetStart = new Date(now.valueOf() + 3 * 24 * 60 * 60 * 1000);
    targetStart.setHours(0, 0, 0, 0);

    const targetEnd = new Date(now.valueOf() + 3 * 24 * 60 * 60 * 1000);
    targetEnd.setHours(23, 59, 59, 999);

    // 3. 🔍 DB Query: Active Subscription එකක් තිබෙන, Renewal එක තව දවස් 3කින් එන Users ලා
    const { data: activeUsers, error } = await supabase
      .from("users")
      .select("phone_number, subscription_ends_at")
      .eq("is_paid", true)
      .eq("subscription_status", "active")
      .gte("subscription_ends_at", targetStart.toISOString())
      .lte("subscription_ends_at", targetEnd.toISOString());

    if (error) {
      console.error("❌ Error fetching active users for monthly reminder:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`🔍 Found ${activeUsers?.length || 0} active users for monthly renewal reminder.`);

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users up for renewal in 3 days.",
        messagesSent: 0,
      });
    }

    // 4. 📩 Monthly Renewal WhatsApp Message එක යැවීම
    const sendPromises = activeUsers.map(async (user) => {
      const phone = user.phone_number;

      const messageBody = `Hi Bro! 👋\n\nඔයාගේ *Broo.ai Pro* Monthly Subscription එක තව දවස් 3කින් Auto-Renew වෙනවා. 💳\n\nBroo.ai එකත් එක්ක එකතු වෙලා daily expenses පිළිවෙලට manage කරගන්නවාට තැන්කියු! 🚀\n\nගෙවීම් සම්බන්ධව යම් ගැටලුවක් ඇත්නම් Support එක අමතන්න.`;

      try {
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${phone}`,
          body: messageBody,
        });
        console.log(`✅ Monthly Renewal reminder sent to: ${phone}`);
      } catch (sendErr) {
        console.error(`❌ Failed to send WhatsApp to ${phone}:`, sendErr);
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({
      success: true,
      messagesSent: activeUsers.length,
    });
  } catch (err: any) {
    console.error("❌ Monthly Cron Exception:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}