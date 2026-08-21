import { supabase } from "@/lib/supabase";

// ⚠️ NOT CURRENTLY CALLED FROM ANY LIVE ROUTE (as of 2026-08-18).
// app/api/whatsapp/route.ts has its own inline limit-check logic
// (see recordLimitHit() there) which is what's actually live in
// production. This file is kept as a channel-agnostic reference /
// future refactor target — before wiring it in, note it differs from
// the live inline logic in 3 ways that need reconciling:
//   1. Keyed by user.id here vs phone_number in route.ts
//   2. Hardcoded messages here vs finance-logic.ts's localized templates
//   3. Would also need to be wired into app/api/telegram/route.ts —
//      BUT DON'T, at least not as-is: Telegram is intentionally free
//      and does NOT track limit_hits_this_week (business decision,
//      2026-08-18). This file's recordLimitHit() below fires purely on
//      `plan`, with no channel awareness — wiring it into the Telegram
//      route unmodified would silently start tracking Telegram users
//      again. Any future refactor must keep that channel check.
// Also confirm the `limit_hits_this_week` column migration (bottom of
// this file) has actually been run before relying on this counter.
//
// NOTE: keyed by Supabase `id` (primary key) instead of `phone_number` —
// dashboard login already resolves a user via WhatsApp number OR email,
// so `user.id` is the one identifier guaranteed to exist no matter which
// channel the user registered/logged in with (WhatsApp, email, or later Telegram).
//
// This also means it's channel-agnostic BY DEFAULT — but per the note
// above, Telegram must NOT actually get the weekly limit-hit counter.
// Any caller wiring this in for Telegram needs to skip recordLimitHit()
// there (e.g. pass a channel flag, or just not call it from that route).

export async function checkUserLimits(
  userId: string,
  type: "expense_income" | "ocr" | "voice"
): Promise<{ allowed: boolean; message?: string }> {

  // 1. Fetch User Data
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return { allowed: false, message: "User account not found. Please register first." };
  }

  const today = new Date().toISOString().split("T")[0];
  let dailyTx = user.daily_tx_count || 0;
  let dailyOcr = user.daily_ocr_count || 0;
  let monthlyOcr = user.monthly_ocr_count || 0;
  let dailyVoice = user.daily_voice_count || 0;

  // 2. Reset Daily Counts on a New Day
  if (user.last_activity_date !== today) {
    dailyTx = 0;
    dailyOcr = 0;
    dailyVoice = 0;
    await supabase.from("users").update({
      daily_tx_count: 0,
      daily_ocr_count: 0,
      daily_voice_count: 0,
      last_activity_date: today,
    }).eq("id", userId);
  }

  // 🔧 FIX: DB stores plan as "LITE" / "CORE" / "MAX" (uppercase) — without
  // .toLowerCase() here, `plan === "lite"` never matched, so Lite users
  // were never actually limit-checked at all (unlimited free usage).
  const plan = (user.plan || "lite").toLowerCase();

  // Helper: every time we're about to block a user, that's a strong
  // "wants to upgrade" signal. Track it so the weekly upgrade-nudge cron
  // can target the users who hit walls the MOST, not just once.
  const recordLimitHit = async () => {
    await supabase
      .from("users")
      .update({ limit_hits_this_week: (user.limit_hits_this_week || 0) + 1 })
      .eq("id", userId);
  };

  // --- 1. EXPENSE & INCOME TRACKING LIMIT ---
  if (type === "expense_income") {
    if (plan === "lite" && dailyTx >= 3) {
      await recordLimitHit();
      return {
        allowed: false,
        message: `⚠️ *Daily Limit Reached!* (3/3 Expenses)\n\nBroo Lite එකේ දවසකට ඇතුලත් කළ හැක්කේ Transactions 3ක් පමණි.\n\n🚀 Unlimited tracking සඳහා **Broo Core ($2.55/mo)** හෝ **Broo Max ($5.99/mo)** ලබාගන්න:\n🔗 https://brofinai.com/upgrade`
      };
    }
    if (plan === "core" && dailyTx >= 10) {
      await recordLimitHit();
      return {
        allowed: false,
        message: `⚠️ *Daily Limit Reached!* (10/10 Expenses)\n\nBroo Core එකේ දවසකට Max Transactions 10යි.\n\n🚀 Unlimited tracking සඳහා **Broo Max ($5.99/mo)** එකට Upgrade වන්න:\n🔗 https://brofinai.com/upgrade`
      };
    }
  }

  // --- 2. AI RECEIPT OCR PHOTO SCANNING LIMIT ---
  if (type === "ocr") {
    if (plan === "lite" && dailyOcr >= 1) {
      await recordLimitHit();
      return {
        allowed: false,
        message: `⚠️ *Daily OCR Scan Limit Reached!* (1/1 Scan)\n\nBroo Lite එකේ දවසකට Receipt Scans 1යි.\n\n📸 මාසෙට Scans 30ක් සඳහා **Broo Core ($2.55)** හෝ Unlimited Scans සඳහා **Broo Max ($5.99)** ලබාගන්න:\n🔗 https://brofinai.com/upgrade`
      };
    }
    if (plan === "core" && monthlyOcr >= 30) {
      await recordLimitHit();
      return {
        allowed: false,
        message: `⚠️ *Monthly OCR Limit Reached!* (30/30 Scans)\n\nBroo Core හි මෙම මාසයේ Scans 30 සීමාව අවසන්.\n\n🚀 Unlimited Scans සඳහා **Broo Max ($5.99)** එකට Upgrade වන්න:\n🔗 https://brofinai.com/upgrade`
      };
    }
  }

  // --- 3. VOICE TRACKING LIMIT ---
  if (type === "voice") {
    if (plan === "lite") {
      await recordLimitHit();
      return {
        allowed: false,
        message: `🎙️ *Voice Tracking is Locked!*\n\nBroo Lite එකේ Voice Notes මඟින් Expenses ඇතුලත් කළ නොහැක.\n\n🚀 Voice Notes 5ක්/දිනකට සඳහා **Broo Core ($2.55)** හෝ Unlimited Voice Tracking සඳහා **Broo Max ($5.99)** ලබාගන්න:\n🔗 https://brofinai.com/upgrade`
      };
    }
    if (plan === "core" && dailyVoice >= 5) {
      await recordLimitHit();
      return {
        allowed: false,
        message: `⚠️ *Daily Voice Limit Reached!* (5/5 Voice Notes)\n\nBroo Core හි දිනකට Voice Notes 5 සීමාව අවසන්.\n\n🚀 Unlimited Voice Tracking සඳහා **Broo Max ($5.99)** ලබාගන්න:\n🔗 https://brofinai.com/upgrade`
      };
    }
  }

  return { allowed: true };
}

// 3. Increment Usage Function
export async function incrementUsage(userId: string, type: "expense_income" | "ocr" | "voice") {
  const { data: user } = await supabase.from("users").select("*").eq("id", userId).single();
  if (!user) return;

  if (type === "expense_income") {
    await supabase.from("users").update({ daily_tx_count: (user.daily_tx_count || 0) + 1 }).eq("id", userId);
  } else if (type === "ocr") {
    await supabase.from("users").update({
      daily_ocr_count: (user.daily_ocr_count || 0) + 1,
      monthly_ocr_count: (user.monthly_ocr_count || 0) + 1
    }).eq("id", userId);
  } else if (type === "voice") {
    await supabase.from("users").update({ daily_voice_count: (user.daily_voice_count || 0) + 1 }).eq("id", userId);
  }
}

/*
  ⚠️ MIGRATION NEEDED before this works:
  ALTER TABLE users ADD COLUMN limit_hits_this_week integer DEFAULT 0;

  This counter gets reset to 0 by the weekly upgrade-nudge cron
  (see cron-upgrade-nudge/route.ts) AFTER it sends the targeted message —
  so it always reflects "since the last nudge", not an all-time total.
*/