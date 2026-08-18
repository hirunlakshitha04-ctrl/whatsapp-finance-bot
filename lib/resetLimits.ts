import { supabaseAdmin } from "./supabaseAdmin";

// 🔧 FIX: previously wrote `daily_text_count` instead of `daily_tx_count`,
// so the transaction counter never actually reset with the rest of the
// counters. This kept counting up forever across days for some users.
export async function checkAndResetDailyLimits(user: any) {
  // Supabase/PostgreSQL UTC Timezone එකට අනුව අද දිනය (YYYY-MM-DD) ලබාගැනීම
  const todayUTC = new Date().toISOString().split("T")[0];

  // Database එකේ ඇති last_usage_date එක UTC Date string එකක් බවට හැරවීම
  const lastUsageUTC = user.last_usage_date
    ? new Date(user.last_usage_date).toISOString().split("T")[0]
    : null;

  // Supabase UTC දිනය වෙනස් වී ඇත්නම් Daily Counters "0" කරන්න
  if (lastUsageUTC !== todayUTC) {
    const { error } = await supabaseAdmin
      .from("users") // ඔබගේ Supabase Database Table Name එක 'users' නෙවෙයි නම් එය මෙතනට යොදන්න
      .update({
        daily_tx_count: 0, // ✅ FIXED — was daily_text_count
        daily_ocr_count: 0,
        daily_voice_count: 0,
        last_usage_date: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error resetting daily limits:", error);
      return;
    }

    // In-memory user object එකද Update කිරීම
    user.daily_tx_count = 0; // ✅ FIXED — was daily_text_count
    user.daily_ocr_count = 0;
    user.daily_voice_count = 0;
    user.last_usage_date = todayUTC;
  }
}