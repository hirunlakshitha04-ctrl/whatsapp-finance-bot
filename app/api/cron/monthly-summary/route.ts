import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import twilio from "twilio";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const TWILIO_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

// Helper: Check if today is the LAST day of the month at 9 PM in user's timezone
function isMonthEnd9PM(timeZone: string): boolean {
  try {
    const now = new Date();

    // Get Hour in user timezone
    const hourStr = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(now);
    if (parseInt(hourStr, 10) !== 21) return false;

    // Get current day of month in user timezone
    const dayStr = new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric" }).format(now);
    const currentDay = parseInt(dayStr, 10);

    // Get total days in current month
    const yearStr = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(now);
    const monthStr = new Intl.DateTimeFormat("en-US", { timeZone, month: "numeric" }).format(now);
    
    const lastDayOfCurrentMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();

    return currentDay === lastDayOfCurrentMonth;
  } catch (err) {
    console.error(`Invalid timezone: ${timeZone}`, err);
    return false;
  }
}

// Helper: Monthly Message Generator with AI Localization
async function generateMonthlySummary(
  nickname: string,
  currency: string,
  income: number,
  expense: number,
  language: string
): Promise<string> {
  const netSavings = income - expense;
  const baseEnglishText = `📅 *Broo.ai MONTHLY SUMMARY*\n\nHi ${nickname}! Here is your full financial recap for this month:\n\n🟢 *Total Monthly Income:* ${currency} ${income.toLocaleString()}\n🔴 *Total Monthly Expense:* ${currency} ${expense.toLocaleString()}\n💰 *Net Savings/Loss:* ${currency} ${netSavings.toLocaleString()}\n\nReady to conquer next month? Let's keep building good financial habits! 🚀`;

  if (!language || language.toLowerCase() === "english") {
    return baseEnglishText;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a translator for Broo.ai personal finance app. Translate the following monthly financial report into "${language}". Keep formatting (*, emojis, numbers, currency) intact. Return only the translated text.`
        },
        { role: "user", content: baseEnglishText }
      ],
      temperature: 0.3
    });

    return response.choices[0].message.content || baseEnglishText;
  } catch (e) {
    console.error("Monthly Translation Error:", e);
    return baseEnglishText;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { data: users, error: userErr } = await supabase.from("users").select("*");
    if (userErr || !users) return NextResponse.json({ error: "No users found" }, { status: 400 });

    // First day of current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const user of users) {
      const userTz = user.timezone || "Asia/Colombo";

      // Trigger only on the last day of the month at 9 PM
      if (!isMonthEnd9PM(userTz)) {
        continue;
      }

      // Fetch all transactions from 1st of the current month
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("phone_number", user.phone_number)
        .gte("created_at", firstDayOfMonth.toISOString());

      let totalIncome = 0;
      let totalExpense = 0;

      if (transactions) {
        transactions.forEach((tx) => {
          if (tx.type === "income") totalIncome += Number(tx.amount);
          if (tx.type === "expense") totalExpense += Number(tx.amount);
        });
      }

      const currency = user.base_currency || user.currency || "LKR";
      const nickname = user.how_to_call_you || user.nickname || "Bro";
      const userLang = user.language || user.preferred_language || "English";

      const summaryMessage = await generateMonthlySummary(
        nickname,
        currency,
        totalIncome,
        totalExpense,
        userLang
      );

      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${user.phone_number}`,
        body: summaryMessage,
      });
    }

    return NextResponse.json({ success: true, message: "Monthly Summaries processed successfully!" });
  } catch (error) {
    console.error("Monthly Cron Error:", error);
    return NextResponse.json({ error: "Failed to process monthly summaries" }, { status: 500 });
  }
}