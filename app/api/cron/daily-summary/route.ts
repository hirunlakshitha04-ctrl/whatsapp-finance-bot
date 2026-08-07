import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import twilio from "twilio";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const TWILIO_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

// Helper Function: Check if it's currently 9 PM in the user's timezone
function is9PMInTimezone(timeZone: string): boolean {
  try {
    const now = new Date();
    // Get current hour in the specific timezone (0 - 23 format)
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone,
      hour: "numeric",
      hour12: false,
    }).format(now);

    return parseInt(hourStr, 10) === 21; // 21 means 9:00 PM
  } catch (err) {
    console.error(`Invalid timezone: ${timeZone}`, err);
    return false;
  }
}

// Helper Function: Localize Summary Message based on User Language
async function generateLocalizedSummary(
  nickname: string,
  currency: string,
  income: number,
  expense: number,
  language: string
): Promise<string> {
  const baseEnglishText = `📊 *Broo.ai DAILY SUMMARY*\n\nHi ${nickname}! Here is your financial summary for today:\n\n🟢 *Total Income:* ${currency} ${income.toLocaleString()}\n🔴 *Total Expense:* ${currency} ${expense.toLocaleString()}\n💡 *Remaining Balance:* ${currency} ${(income - expense).toLocaleString()}\n\nHave a great evening! 🚀`;

  if (!language || language.toLowerCase() === "english") {
    return baseEnglishText;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a translator for Broo.ai personal finance app. Translate the following daily financial report into "${language}". Keep all formatting (*, emojis, numbers, currency) intact. Return only the translated text.`
        },
        { role: "user", content: baseEnglishText }
      ],
      temperature: 0.3
    });

    return response.choices[0].message.content || baseEnglishText;
  } catch (e) {
    console.error("Summary Translation Error:", e);
    return baseEnglishText;
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. All Active Users ගන්න
    const { data: users, error: userErr } = await supabase.from("users").select("*");
    if (userErr || !users) return NextResponse.json({ error: "No users found" }, { status: 400 });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 2. Loop through users and filter who currently have 9 PM in their timezone
    for (const user of users) {
      const userTz = user.timezone || "Asia/Colombo";

      // Check if current local time in user's timezone is 9:00 PM
      if (!is9PMInTimezone(userTz)) {
        continue; // 9 PM නැති අය skip කරන්න
      }

      // 3. User ගේ අද දවසේ Transactions ගන්න
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("phone_number", user.phone_number)
        .gte("created_at", todayStart.toISOString());

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

      // 4. Translate message into user selected language
      const summaryMessage = await generateLocalizedSummary(
        nickname,
        currency,
        totalIncome,
        totalExpense,
        userLang
      );

      // 5. Send WhatsApp Message
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${user.phone_number}`,
        body: summaryMessage,
      });
    }

    return NextResponse.json({ success: true, message: "9 PM Summaries processed successfully!" });
  } catch (error) {
    console.error("Cron Fatal Error:", error);
    return NextResponse.json({ error: "Failed to process summaries" }, { status: 500 });
  }
}