// 📂 Place this at: app/api/cron/telegram-monthly-summary/route.ts  (NEW FILE)
//
// Telegram twin of app/api/cron/monthly-summary/route.ts.
// Same "last day of month, 9PM per timezone" logic, telegram_chat_id +
// sendTelegramMessage.

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { OpenAI } from "openai";
import { sendTelegramMessage } from "@/lib/telegram-client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function isMonthEnd9PM(timeZone: string): boolean {
  try {
    const now = new Date();

    const hourStr = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(now);
    if (parseInt(hourStr, 10) !== 21) return false;

    const dayStr = new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric" }).format(now);
    const currentDay = parseInt(dayStr, 10);

    const yearStr = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(now);
    const monthStr = new Intl.DateTimeFormat("en-US", { timeZone, month: "numeric" }).format(now);
    const lastDayOfCurrentMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();

    return currentDay === lastDayOfCurrentMonth;
  } catch (err) {
    console.error(`Invalid timezone: ${timeZone}`, err);
    return false;
  }
}

async function generateMonthlySummary(
  nickname: string,
  currency: string,
  income: number,
  expense: number,
  language: string
): Promise<string> {
  const netSavings = income - expense;
  const baseEnglishText = `📅 *Brofinai MONTHLY SUMMARY*\n\nHi ${nickname}! Here is your full financial recap for this month:\n\n🟢 *Total Monthly Income:* ${currency} ${income.toLocaleString()}\n🔴 *Total Monthly Expense:* ${currency} ${expense.toLocaleString()}\n💰 *Net Savings/Loss:* ${currency} ${netSavings.toLocaleString()}\n\nReady to conquer next month? Let's keep building good financial habits! 🚀`;

  if (!language || language.toLowerCase() === "english") {
    return baseEnglishText;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a translator for Brofinai personal finance app. Translate the following monthly financial report into "${language}". Keep formatting (*, emojis, numbers, currency) intact. Return only the translated text.`,
        },
        { role: "user", content: baseEnglishText },
      ],
      temperature: 0.3,
    });
    return response.choices[0].message.content || baseEnglishText;
  } catch (e) {
    console.error("Monthly Translation Error:", e);
    return baseEnglishText;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { data: users, error: userErr } = await supabase
      .from("users")
      .select("*")
      .not("telegram_chat_id", "is", null);

    if (userErr || !users) return NextResponse.json({ error: "No users found" }, { status: 400 });

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let sent = 0;

    for (const user of users) {
      const userTz = user.timezone || "Asia/Colombo";
      if (!isMonthEnd9PM(userTz)) continue;

      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("telegram_chat_id", user.telegram_chat_id)
        .gte("created_at", firstDayOfMonth.toISOString());

      let totalIncome = 0;
      let totalExpense = 0;
      (transactions || []).forEach((tx) => {
        if (tx.type === "income") totalIncome += Number(tx.amount);
        if (tx.type === "expense") totalExpense += Number(tx.amount);
      });

      const currency = user.base_currency || user.currency || "LKR";
      const nickname = user.how_to_call_you || user.nickname || "Bro";
      const userLang = user.language || user.preferred_language || "English";

      const summaryMessage = await generateMonthlySummary(nickname, currency, totalIncome, totalExpense, userLang);

      try {
        await sendTelegramMessage(user.telegram_chat_id, summaryMessage);
        sent++;
      } catch (sendErr) {
        console.error(`❌ Failed to send Telegram monthly summary to ${user.telegram_chat_id}:`, sendErr);
      }
    }

    return NextResponse.json({ success: true, message: "Telegram Monthly Summaries processed!", sent });
  } catch (error) {
    console.error("Telegram Monthly Summary Cron Error:", error);
    return NextResponse.json({ error: "Failed to process monthly summaries" }, { status: 500 });
  }
}