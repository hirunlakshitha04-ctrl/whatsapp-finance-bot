// 📂 Place this at: app/api/cron/telegram-daily-summary/route.ts  (NEW FILE)
//
// Telegram twin of app/api/cron/daily-summary/route.ts.
// Same 9PM-per-timezone logic, but queries telegram_chat_id and sends
// via sendTelegramMessage instead of Twilio.
//
// ⚠️ Adjust the import below if your lib/telegram-client.ts export name
// or signature differs from `sendTelegramMessage(chatId, text)`.

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { OpenAI } from "openai";
import { sendTelegramMessage } from "@/lib/telegram-client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function is9PMInTimezone(timeZone: string): boolean {
  try {
    const now = new Date();
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hour12: false,
    }).format(now);
    return parseInt(hourStr, 10) === 21;
  } catch (err) {
    console.error(`Invalid timezone: ${timeZone}`, err);
    return false;
  }
}

async function generateLocalizedSummary(
  nickname: string,
  currency: string,
  income: number,
  expense: number,
  language: string
): Promise<string> {
  const baseEnglishText = `📊 *Brofinai DAILY SUMMARY*\n\nHi ${nickname}! Here is your financial summary for today:\n\n🟢 *Total Income:* ${currency} ${income.toLocaleString()}\n🔴 *Total Expense:* ${currency} ${expense.toLocaleString()}\n💡 *Remaining Balance:* ${currency} ${(income - expense).toLocaleString()}\n\nHave a great evening! 🚀`;

  if (!language || language.toLowerCase() === "english") {
    return baseEnglishText;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a translator for Brofinai personal finance app. Translate the following daily financial report into "${language}". Keep all formatting (*, emojis, numbers, currency) intact. Return only the translated text.`,
        },
        { role: "user", content: baseEnglishText },
      ],
      temperature: 0.3,
    });
    return response.choices[0].message.content || baseEnglishText;
  } catch (e) {
    console.error("Summary Translation Error:", e);
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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let sent = 0;

    for (const user of users) {
      const userTz = user.timezone || "Asia/Colombo";
      if (!is9PMInTimezone(userTz)) continue;

      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("telegram_chat_id", user.telegram_chat_id)
        .gte("created_at", todayStart.toISOString());

      let totalIncome = 0;
      let totalExpense = 0;
      (transactions || []).forEach((tx) => {
        if (tx.type === "income") totalIncome += Number(tx.amount);
        if (tx.type === "expense") totalExpense += Number(tx.amount);
      });

      const currency = user.base_currency || user.currency || "LKR";
      const nickname = user.how_to_call_you || user.nickname || "Bro";
      const userLang = user.language || user.preferred_language || "English";

      const summaryMessage = await generateLocalizedSummary(nickname, currency, totalIncome, totalExpense, userLang);

      try {
        await sendTelegramMessage(user.telegram_chat_id, summaryMessage);
        sent++;
      } catch (sendErr) {
        console.error(`❌ Failed to send Telegram daily summary to ${user.telegram_chat_id}:`, sendErr);
      }
    }

    return NextResponse.json({ success: true, message: "Telegram 9 PM Daily Summaries processed!", sent });
  } catch (error) {
    console.error("Telegram Daily Summary Cron Error:", error);
    return NextResponse.json({ error: "Failed to process daily summaries" }, { status: 500 });
  }
}