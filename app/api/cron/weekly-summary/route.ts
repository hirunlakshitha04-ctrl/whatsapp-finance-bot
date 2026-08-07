import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import twilio from "twilio";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const TWILIO_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

// Helper: Check if it's Sunday 9 PM in user's timezone
function isSunday9PM(timeZone: string): boolean {
  try {
    const now = new Date();
    
    // Get Day of week (Sun = 0)
    const dayStr = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now);
    // Get Hour (21 = 9 PM)
    const hourStr = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(now);

    return dayStr === "Sun" && parseInt(hourStr, 10) === 21;
  } catch (err) {
    console.error(`Invalid timezone: ${timeZone}`, err);
    return false;
  }
}

// Helper: Weekly Message Generator with AI Localization
async function generateWeeklySummary(
  nickname: string,
  currency: string,
  income: number,
  expense: number,
  language: string
): Promise<string> {
  const netSavings = income - expense;
  const baseEnglishText = `📈 *Broo.ai WEEKLY SUMMARY*\n\nHi ${nickname}! Here is your financial summary for this week:\n\n🟢 *Total Income:* ${currency} ${income.toLocaleString()}\n🔴 *Total Expense:* ${currency} ${expense.toLocaleString()}\n💰 *Net Savings:* ${currency} ${netSavings.toLocaleString()}\n\nGreat job keeping track of your money! Have a peaceful week ahead! 🌟`;

  if (!language || language.toLowerCase() === "english") {
    return baseEnglishText;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a translator for Broo.ai personal finance app. Translate the following weekly financial report into "${language}". Keep formatting (*, emojis, numbers, currency) intact. Return only the translated text.`
        },
        { role: "user", content: baseEnglishText }
      ],
      temperature: 0.3
    });

    return response.choices[0].message.content || baseEnglishText;
  } catch (e) {
    console.error("Weekly Translation Error:", e);
    return baseEnglishText;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { data: users, error: userErr } = await supabase.from("users").select("*");
    if (userErr || !users) return NextResponse.json({ error: "No users found" }, { status: 400 });

    // Past 7 Days range
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const user of users) {
      const userTz = user.timezone || "Asia/Colombo";

      // Trigger only on Sunday at 9 PM local time
      if (!isSunday9PM(userTz)) {
        continue;
      }

      // Get transactions for the past 7 days
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("phone_number", user.phone_number)
        .gte("created_at", sevenDaysAgo.toISOString());

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

      const summaryMessage = await generateWeeklySummary(
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

    return NextResponse.json({ success: true, message: "Weekly Summaries processed successfully!" });
  } catch (error) {
    console.error("Weekly Cron Error:", error);
    return NextResponse.json({ error: "Failed to process weekly summaries" }, { status: 500 });
  }
}