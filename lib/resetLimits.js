import { db } from "@/lib/db"; // ඔබගේ Database connection එක

export async function checkAndResetDailyLimits(user) {
  // Supabase/PostgreSQL UTC Timezone එකට අනුව අද දිනය (YYYY-MM-DD) ලබාගැනීම
  const todayUTC = new Date().toISOString().split("T")[0];

  // Database එකේ ඇති last_usage_date එක UTC Date string එකක් බවට හැරවීම
  const lastUsageUTC = user.last_usage_date
    ? new Date(user.last_usage_date).toISOString().split("T")[0]
    : null;

  // Supabase UTC දිනය වෙනස් වී ඇත්නම් Daily Counters "0" කරන්න
  if (lastUsageUTC !== todayUTC) {
    await db.user.update({
      where: { id: user.id },
      data: {
        daily_text_count: 0,
        daily_ocr_count: 0,
        daily_voice_count: 0,
        last_usage_date: new Date(), // Supabase Auto Save timestamp (UTC)
      },
    });

    // In-memory user object එකද Update කිරීම
    user.daily_text_count = 0;
    user.daily_ocr_count = 0;
    user.daily_voice_count = 0;
    user.last_usage_date = todayUTC;
  }
}