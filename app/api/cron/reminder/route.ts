// 📂 Place this at: app/api/cron/reminder/route.ts  (replaces the old single-stage version)
//
// WHATSAPP-ONLY TRIAL FUNNEL — WhatsApp Lite is a 7-DAY TRIAL (unlike
// Telegram, which is permanently free — that channel gets a separate
// engagement cron, see cron-engagement-telegram-route.ts).
//
// Runs once daily. Uses `trial_ends_at` to figure out which day of the
// trial the user is on, and sends ONE message per stage — never repeats
// a stage for the same user (tracked via `last_reminder_stage`).
//
// Stages:
//   Day 1  -> Activation nudge (ONLY if they haven't logged a single
//             transaction yet — most trial users who never send message
//             #1 never convert, so this is the highest-leverage touch)
//   Day 4  -> Feature highlight (OCR scan / voice note) they likely
//             haven't tried, to increase perceived value before the ask
//   Day 6  -> Urgency: trial ends tomorrow (this was the original logic)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "whatsapp:+94764775963";

type Stage = "day1_activation" | "day4_feature" | "day6_urgency";

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));
}

async function sendWhatsApp(phone: string, body: string) {
  try {
    await twilioClient.messages.create({ from: TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${phone}`, body });
    return true;
  } catch (err) {
    console.error(`❌ Failed to send WhatsApp reminder to ${phone}:`, err);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Pull every unpaid WhatsApp trial user with a trial_ends_at set.
    // (last_reminder_stage lets us avoid double-sending the same stage
    // if the cron runs more than once in a day, or the user's timezone
    // pushes them into two windows.)
    const { data: trialUsers, error } = await supabase
      .from("users")
      .select("*")
      .eq("is_paid", false)
      .not("phone_number", "is", null)
      .not("trial_ends_at", "is", null);

    if (error) {
      console.error("❌ Error fetching trial users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!trialUsers || trialUsers.length === 0) {
      return NextResponse.json({ success: true, messagesSent: 0 });
    }

    const now = new Date();
    let sent = 0;

    for (const user of trialUsers) {
      const trialEnd = new Date(user.trial_ends_at);
      const daysUntilEnd = daysBetween(trialEnd, now); // positive = still in trial
      const nickname = user.how_to_call_you || user.nickname || user.name || "Bro";
      const checkoutUrl = `https://brofinai.com/checkout?phone=${encodeURIComponent(user.phone_number)}`;

      let stage: Stage | null = null;

      // Trial is 7 days, so daysUntilEnd counts DOWN from 6 (day1) to 0 (day6/tomorrow).
      if (daysUntilEnd === 6) stage = "day1_activation";
      else if (daysUntilEnd === 3) stage = "day4_feature";
      else if (daysUntilEnd === 1) stage = "day6_urgency";

      if (!stage || user.last_reminder_stage === stage) continue;

      let body = "";

      if (stage === "day1_activation") {
        // Only nudge if they genuinely haven't logged anything yet —
        // otherwise this would annoy an already-active trial user.
        const { count } = await supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("phone_number", user.phone_number);

        if ((count || 0) > 0) continue; // already active, skip this stage silently

        body = `👋 Hey ${nickname}! Your *Brofinai* 7-day trial just started.\n\nHaven't logged your first expense yet — try sending something like *"Spent 500 for lunch"* right now and see how easy it is. 🚀`;
      }

      if (stage === "day4_feature") {
        const hasScanned = (user.daily_ocr_count || 0) > 0 || (user.monthly_ocr_count || 0) > 0;
        body = hasScanned
          ? `📊 Hi ${nickname}! Halfway through your trial — did you know *Broo Core* gives you 30 receipt scans/month, and *Broo Max* unlimited? No more manual typing.\n👉 ${checkoutUrl}`
          : `📸 Hi ${nickname}! Quick tip — try sending a photo of a receipt, Brofinai will auto-read the amount for you. This is even better on *Broo Core/Max* with more scans and voice note tracking. 🎙️\n👉 ${checkoutUrl}`;
      }

      if (stage === "day6_urgency") {
        body = `Hi Bro! 👋\n\nYour *Brofinai* 7-Day Free Trial ends tomorrow. ⏳\n\nStay unlocked and keep tracking without limits:\n👉 ${checkoutUrl}`;
      }

      const ok = await sendWhatsApp(user.phone_number, body);
      if (ok) {
        sent++;
        await supabase.from("users").update({ last_reminder_stage: stage }).eq("id", user.id);
      }
    }

    return NextResponse.json({ success: true, messagesSent: sent });
  } catch (err: any) {
    console.error("❌ WhatsApp Trial Funnel Cron Exception:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

/*
  ⚠️ MIGRATION NEEDED before this works:
  ALTER TABLE users ADD COLUMN last_reminder_stage text;
*/