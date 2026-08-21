// 📂 Place this at: app/api/cron/telegram-engagement/route.ts  (NEW FILE)
//
// TELEGRAM IS PERMANENTLY FREE — there's no trial countdown to create
// urgency with, so the conversion lever here is different:
//   1. INACTIVITY WIN-BACK — bring lapsed users back so they keep
//      experiencing enough value to eventually want more of it
//   2. USAGE-BASED UPSELL — target users who are clearly bumping into
//      Lite's ceiling (repeated limit hits), since that's a much
//      stronger buying signal than a countdown ever is for a free user
//
// Adjust the import below to match your actual lib/telegram-client.ts
// export name — this assumes a `sendTelegramMessage(chatId, text)` helper.
// Share that file if you want this wired to the exact function signature.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/telegram-client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let sent = 0;

    // ---------------- 1. INACTIVITY WIN-BACK (Lite plan, Telegram) ----------------
    // 3 days inactive -> friendly nudge (not a sales pitch, just re-engagement)
    const { data: threeDayInactive } = await supabase
      .from("users")
      .select("*")
      .eq("plan", "lite")
      .not("telegram_chat_id", "is", null)
      .lte("last_active_date", daysAgoISO(3))
      .gt("last_active_date", daysAgoISO(7)); // don't overlap with the 7-day group below

    for (const user of threeDayInactive || []) {
      const nickname = user.how_to_call_you || user.nickname || user.name || "there";
      const body = `👋 Hey ${nickname}, haven't seen you in a few days!\n\nQuick reminder — just send something like *"Spent 500 for lunch"* to log an expense in seconds. Your money habits are easier to build when you track daily. 📊`;
      try {
        await sendTelegramMessage(user.telegram_chat_id, body);
        sent++;
      } catch (sendErr) {
        console.error(`❌ Failed to send 3-day win-back to ${user.telegram_chat_id}:`, sendErr);
      }
    }

    // 7 days inactive -> stronger value reminder + soft upgrade mention
    const { data: sevenDayInactive } = await supabase
      .from("users")
      .select("*")
      .eq("plan", "lite")
      .not("telegram_chat_id", "is", null)
      .lte("last_active_date", daysAgoISO(7));

    for (const user of sevenDayInactive || []) {
      const nickname = user.how_to_call_you || user.nickname || user.name || "there";
      const body = `📉 Hi ${nickname}, it's been a week since your last log on Brofinai.\n\nA week of untracked spending is a week you can't see where your money went. Jump back in — and if 3 logs/day feels tight, *Broo Core* gives you 10/day plus voice notes:\n👉 https://brofinai.com/#pricing`;
      try {
        await sendTelegramMessage(user.telegram_chat_id, body);
        sent++;
      } catch (sendErr) {
        console.error(`❌ Failed to send 7-day win-back to ${user.telegram_chat_id}:`, sendErr);
      }
    }

    // ---------------- 2. USAGE-BASED UPSELL (repeated limit hits) ----------------
    // These are Telegram Lite users clearly outgrowing the free tier —
    // strongest buying signal for a permanently-free channel.
    const { data: heavyLimitHitters } = await supabase
      .from("users")
      .select("*")
      .eq("plan", "lite")
      .not("telegram_chat_id", "is", null)
      .gte("limit_hits_this_week", 3);

    for (const user of heavyLimitHitters || []) {
      const nickname = user.how_to_call_you || user.nickname || user.name || "there";
      const hits = user.limit_hits_this_week || 0;
      const body = `🚀 Hey ${nickname}, you've hit your daily limit *${hits} times* this week alone!\n\nThat's a sign *Broo Core* ($2.50/mo on Telegram) or *Broo Max* ($4.00/mo, unlimited) would fit you better — no more waiting till tomorrow to log:\n👉 https://brofinai.com/#pricing`;
      try {
        await sendTelegramMessage(user.telegram_chat_id, body);
        sent++;
        // Reset the counter so next week starts fresh and this doesn't
        // re-fire daily once the threshold is crossed.
        await supabase.from("users").update({ limit_hits_this_week: 0 }).eq("id", user.id);
      } catch (sendErr) {
        console.error(`❌ Failed to send limit-hitter upsell to ${user.telegram_chat_id}:`, sendErr);
      }
    }

    return NextResponse.json({
      success: true,
      messagesSent: sent,
      breakdown: {
        threeDayInactive: threeDayInactive?.length || 0,
        sevenDayInactive: sevenDayInactive?.length || 0,
        heavyLimitHitters: heavyLimitHitters?.length || 0,
      },
    });
  } catch (err: any) {
    console.error("❌ Telegram Engagement Cron Exception:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

/*
  ⚠️ BEFORE THIS WORKS:
  1. Confirm your actual telegram-client.ts export — swap the import
     at the top if the function name/signature differs.
  2. Same `limit_hits_this_week` migration as limitChecker.ts:
       ALTER TABLE users ADD COLUMN limit_hits_this_week integer DEFAULT 0;
  3. Register this route in your Vercel cron schedule (vercel.json),
     e.g. once daily, separate from the WhatsApp trial funnel cron.
*/