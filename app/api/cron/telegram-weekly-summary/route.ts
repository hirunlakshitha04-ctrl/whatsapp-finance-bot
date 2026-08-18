// 📂 Place this at: app/api/cron/telegram-weekly-summary/route.ts  (NEW FILE)
//
// Telegram twin of app/api/cron/weekly-summary/route.ts.
// Same Sunday-9PM-per-timezone logic, telegram_chat_id + sendTelegramMessage.

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { OpenAI } from "openai";
import { sendTelegramMessage } from "@/lib/telegram-client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function isSunday9PM(timeZone: string): boolean {
  try {
    const now = new Date();
    const dayStr = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now);
    const hourStr = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(now);
    return dayStr === "Sun" && parseInt(hourStr, 10) === 21;
  } catch (err) {
    console.error(`Invalid timezone: ${timeZone}`, err);
    return false;
  }
}

async function generateWeeklySummary(
  nickname: string,
  currency: string,
  income: number,
  expense: number,
  language: string
): Promise<string> {
  const netSavings = income - expense;
  const baseEnglishText = `📈 *Brofinai WEEKLY SUMMARY*\n\nHi ${nickname}! Here is your financial summary for this week:\n\n🟢 *Total Income:* ${currency} ${income.toLocaleString()}\n🔴 *Total Expense:* ${currency} ${expense.toLocaleString()}\n💰 *Net Savings:* ${currency} ${netSavings.toLocaleString()}\n\nGreat job keeping track of your money! Have a peaceful week ahead! 🌟`;

  if (!language || language.toLowerCase() === "english") {
    return baseEnglishText;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a translator for Brofinai personal finance app. Translate the following weekly financial report into "${language}". Keep formatting (*, emojis, numbers, currency) intact. Return only the translated text.`,
        },
        { role: "user", content: baseEnglishText },
      ],
      temperature: 0.3,
    });
    return response.choices[0].message.content || baseEnglishText;
  } catch (e) {
    console.error("Weekly Translation Error:", e);
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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let sent = 0;

    for (const user of users) {
      const userTz = user.timezone || "Asia/Colombo";
      if (!isSunday9PM(userTz)) continue;

      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("telegram_chat_id", user.telegram_chat_id)
        .gte("created_at", sevenDaysAgo.toISOString());

      let totalIncome = 0;
      let totalExpense = 0;
      (transactions || []).forEach((tx) => {
        if (tx.type === "income") totalIncome += Number(tx.amount);
        if (tx.type === "expense") totalExpense += Number(tx.amount);
      });

      const currency = user.base_currency || user.currency || "LKR";
      const nickname = user.how_to_call_you || user.nickname || "Bro";
      const userLang = user.language || user.preferred_language || "English";

      const summaryMessage = await generateWeeklySummary(nickname, currency, totalIncome, totalExpense, userLang);

      try {
        await sendTelegramMessage(user.telegram_chat_id, summaryMessage);
        sent++;
      } catch (sendErr) {
        console.error(`❌ Failed to send Telegram weekly summary to ${user.telegram_chat_id}:`, sendErr);
      }
    }

    return NextResponse.json({ success: true, message: "Telegram Weekly Summaries processed!", sent });
  } catch (error) {
    console.error("Telegram Weekly Summary Cron Error:", error);
    return NextResponse.json({ error: "Failed to process weekly summaries" }, { status: 500 });
  }
}