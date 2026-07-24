import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

// 🔒 Admin Privileges ඇති Service Role Client එක (RLS Bypass කිරීම සඳහා)
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
    // 1. 🔒 Security Check: Vercel Cron Secret Verification
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. 📅 හෙට දවස (Next 24 Hours) Calculation එක
    const now = new Date();
    const tomorrowStart = new Date(now.valueOf() + 24 * 60 * 60 * 1000);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(now.valueOf() + 24 * 60 * 60 * 1000);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // 3. 🔍 DB Query: හෙටින් Trial එක ඉවරවෙන, Unpaid Users ලාව ලබා ගැනීම
    const { data: expiringUsers, error } = await supabase
      .from("users")
      .select("phone_number, trial_ends_at")
      .eq("is_paid", false)
      .gte("trial_ends_at", tomorrowStart.toISOString())
      .lte("trial_ends_at", tomorrowEnd.toISOString());

    if (error) {
      console.error("❌ Error fetching users for Day 6 reminder:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`🔍 Found ${expiringUsers?.length || 0} users for Day 6 reminder.`);

    if (!expiringUsers || expiringUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users expiring tomorrow.",
        messagesSent: 0,
      });
    }

    // 4. 📩 අදාළ Users ලාට WhatsApp Messages යැවීම
    const sendPromises = expiringUsers.map(async (user) => {
      const phone = user.phone_number;
      const checkoutUrl = `https://broo.ai/checkout?phone=${encodeURIComponent(phone)}`;

      const messageBody = `Hi Bro! 👋\n\nඔයාගේ *Broo.ai* 7-Day Free Trial එක හෙටින් ඉවර වෙනවා. ⏳\n\nService එක Block වෙන්නේ නැතුව දිගටම Expense Tracker එක පාවිච්චි කරන්න මෙතනින් Subscribe වෙන්න:\n👉 ${checkoutUrl}`;

      try {
        await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${phone}`,
          body: messageBody,
        });
        console.log(`✅ Reminder sent to: ${phone}`);
      } catch (sendErr) {
        console.error(`❌ Failed to send WhatsApp to ${phone}:`, sendErr);
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({
      success: true,
      messagesSent: expiringUsers.length,
    });
  } catch (err: any) {
    console.error("❌ Cron Exception:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}