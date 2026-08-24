import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);
const TWILIO_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "whatsapp:+94764775963";

export async function GET(request: Request) {
  try {
    // Cron Secret Authorization (Optional Security Check)
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // දින 4කට පෙර දිනය ලබා ගැනීම
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Supabase මගින් දින 4ක් Inactive Paid Users (core, max) සොයා ගැනීම
    //    🆕 last_active_date වෙනුවට last_activity_date (users table එකේ actual column එක) use කරයි
    const { data: inactiveUsers, error } = await supabase
      .from("users")
      .select("*")
      .in("plan", ["core", "max"])
      .lte("last_activity_date", fourDaysAgo);

    if (error) {
      console.error("❌ Error fetching inactive users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!inactiveUsers || inactiveUsers.length === 0) {
      return NextResponse.json({ message: "No inactive users found today." });
    }

    // 2. Twilio හරහා Message එක යැවීම
    for (const user of inactiveUsers) {
      const nickname = user.how_to_call_you || user.nickname || user.name || "there";
      const messageBody = `👋 Hey ${nickname}! Your budget breakdown is waiting for you.\n\nDid you have any expenses or income today?\n🎙️ *Quick Tip:* Just send a *Voice Note* like "Spent 1500 for petrol" to log it in 3 seconds!`;

      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${user.phone_number}`,
        body: messageBody,
      });
    }

    return NextResponse.json({
      success: true,
      messagedUsersCount: inactiveUsers.length,
    });
  } catch (err) {
    console.error("❌ Retention Cron Job Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}