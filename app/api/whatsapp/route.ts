import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { OpenAI } from "openai";
import { supabase } from "@/lib/supabase";
import twilio from "twilio";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ============================================================
// 🌍 Country / Currency detection from the WhatsApp phone number
// ============================================================
const CALLING_CODE_MAP: Record<string, { country: string; currency: string }> = {
  "1": { country: "United States / Canada", currency: "USD" },
  "44": { country: "United Kingdom", currency: "GBP" },
  "91": { country: "India", currency: "INR" },
  "94": { country: "Sri Lanka", currency: "LKR" },
  "61": { country: "Australia", currency: "AUD" },
  "64": { country: "New Zealand", currency: "NZD" },
  "65": { country: "Singapore", currency: "SGD" },
  "60": { country: "Malaysia", currency: "MYR" },
  "971": { country: "United Arab Emirates", currency: "AED" },
  "966": { country: "Saudi Arabia", currency: "SAR" },
  "974": { country: "Qatar", currency: "QAR" },
  "965": { country: "Kuwait", currency: "KWD" },
  "973": { country: "Bahrain", currency: "BHD" },
  "968": { country: "Oman", currency: "OMR" },
  "92": { country: "Pakistan", currency: "PKR" },
  "880": { country: "Bangladesh", currency: "BDT" },
  "977": { country: "Nepal", currency: "NPR" },
  "63": { country: "Philippines", currency: "PHP" },
  "62": { country: "Indonesia", currency: "IDR" },
  "66": { country: "Thailand", currency: "THB" },
  "84": { country: "Vietnam", currency: "VND" },
  "86": { country: "China", currency: "CNY" },
  "81": { country: "Japan", currency: "JPY" },
  "82": { country: "South Korea", currency: "KRW" },
  "49": { country: "Germany", currency: "EUR" },
  "33": { country: "France", currency: "EUR" },
  "39": { country: "Italy", currency: "EUR" },
  "34": { country: "Spain", currency: "EUR" },
  "31": { country: "Netherlands", currency: "EUR" },
  "353": { country: "Ireland", currency: "EUR" },
  "27": { country: "South Africa", currency: "ZAR" },
  "234": { country: "Nigeria", currency: "NGN" },
  "254": { country: "Kenya", currency: "KES" },
  "20": { country: "Egypt", currency: "EGP" },
  "55": { country: "Brazil", currency: "BRL" },
  "52": { country: "Mexico", currency: "MXN" },
};

function detectCountryCurrency(rawPhoneNumber: string): { country: string; currency: string } {
  const digits = rawPhoneNumber.replace("whatsapp:", "").replace(/\D/g, "");

  for (const len of [3, 2, 1]) {
    const prefix = digits.slice(0, len);
    if (CALLING_CODE_MAP[prefix]) {
      return CALLING_CODE_MAP[prefix];
    }
  }

  return { country: "Unknown", currency: "USD" };
}

// ============================================================
// 👤 User / Onboarding helpers
// ============================================================
type UserStatus = "awaiting_name" | "awaiting_confirmation" | "awaiting_edit" | "active";

interface AppUser {
  phone_number: string;
  name: string | null;
  country: string | null;
  currency: string | null;
  preferred_language: string;
  status: UserStatus;
}

async function getUser(phoneNumber: string): Promise<AppUser | null> {
  const { data } = await supabase
    .from("users")
    .select("phone_number, name, country, currency, preferred_language, status")
    .eq("phone_number", phoneNumber)
    .maybeSingle();

  return (data as AppUser) || null;
}

async function createUser(phoneNumber: string): Promise<AppUser> {
  const newUser: AppUser = {
    phone_number: phoneNumber,
    name: null,
    country: null,
    currency: null,
    preferred_language: "en",
    status: "awaiting_name",
  };
  await supabase.from("users").insert([newUser]);
  return newUser;
}

async function updateUser(phoneNumber: string, fields: Partial<AppUser>) {
  await supabase.from("users").update(fields).eq("phone_number", phoneNumber);
}

// ============================================================
// 🧾 Shared formatting helpers
// ============================================================
function actionFooter(language: string): string {
  return language === "si"
    ? `-> හරිනම් *Confirm* කියලා reply කරපන්.\n-> වැරදියි නම් *Edit* කියලා reply කරපන්.`
    : `-> Reply *Confirm* if this looks right.\n-> Reply *Edit* if something's wrong.`;
}

async function handleOnboarding(user: AppUser, incomingText: string, from: string, to: string) {
  if (user.status === "awaiting_name") {
    const name = incomingText.trim();

    if (!name) {
      await twilioClient.messages.create({
        from: to,
        to: from,
        body: "👋 Welcome! I'm your zero-friction expense tracker.\n\nWhat should I call you?",
      });
      return;
    }

    const { country, currency } = detectCountryCurrency(from);

    await updateUser(from, { name, country, currency, status: "awaiting_confirmation" });

    await twilioClient.messages.create({
      from: to,
      to: from,
      body:
        `Thanks, ${name}! 🙌 We auto-detected your location.\n\n` +
        `📍 Country: *${country}*\n` +
        `💱 Currency: *${currency}*\n\n` +
        `Is this correct?\n` +
        `-> Reply *Confirm* ✅ to continue.\n` +
        `-> Reply *Edit* ✏️ to change it.`,
    });
    return;
  }

  if (user.status === "awaiting_confirmation") {
    const normalized = incomingText.trim().toLowerCase();

    if (normalized.includes("confirm")) {
      await updateUser(from, { status: "active" });
      await twilioClient.messages.create({
        from: to,
        to: from,
        body:
          `👑 *WELCOME TO THE FUTURE OF EXPENSE TRACKING* 🚀\n\n` +
          `${user.name}, your profile is now active. No apps, no friction — just clean financial control.\n\n` +
          `⚡ *Here's what you can do*\n\n` +
          `🎤 *Voice Notes*\n` +
          `Send a quick voice note in English, Sinhala, Singlish, or Arabic and it's logged automatically.\n\n` +
          `💬 *Natural Text*\n` +
          `Type exactly how you talk:\n` +
          `• "Spent 450 for coffee"\n` +
          `• "threewheel ekata 300ක් giya"\n` +
          `• "අම්මාට 5000ක් දුන්නා"\n\n` +
          `🏦 *Loan & Debt Tracking*\n` +
          `Track what you owe or what people owe you:\n` +
          `• "Paid 15,000 for Commercial Bank loan"\n` +
          `• "යාලුවාගෙන් 5000ක් ණයට ගත්තා"\n` +
          `• "Lease එකට 45,000ක් ගෙව්වා"\n\n` +
          `🧠 *Smart Categorization*\n` +
          `Amount, currency, and category are detected automatically.\n\n` +
          `📊 *Real-Time Insights*\n` +
          `Type *Summary* anytime for a clean breakdown of your spending and debts.\n\n` +
          `🎯 *Try it now* — send your first text or voice note below 👇\n` +
          `Example: "Paid 50 for my credit card"`,
      });
      return;
    }

    if (normalized.includes("edit")) {
      await updateUser(from, { status: "awaiting_edit" });
      await twilioClient.messages.create({
        from: to,
        to: from,
        body:
          `No problem! Reply with your correct details in this format:\n\n` +
          `*Country, Currency*\n` +
          `(e.g. "United Kingdom, GBP")`,
      });
      return;
    }

    await twilioClient.messages.create({
      from: to,
      to: from,
      body: `Please reply *Confirm* ✅ or *Edit* ✏️ to continue setting up your account.`,
    });
    return;
  }

  if (user.status === "awaiting_edit") {
    const parts = incomingText.split(",").map((p) => p.trim()).filter(Boolean);
    const country = parts[0] || "Unknown";
    const currency = (parts[1] || "USD").toUpperCase();

    await updateUser(from, { country, currency, status: "awaiting_confirmation" });

    await twilioClient.messages.create({
      from: to,
      to: from,
      body:
        `Got it! Updated details:\n\n` +
        `📍 Country: *${country}*\n` +
        `💱 Currency: *${currency}*\n\n` +
        `-> Reply *Confirm* ✅ to continue.\n` +
        `-> Reply *Edit* ✏️ to change it.`,
    });
    return;
  }
}

// ---- Helpers ----

function getExtensionFromContentType(contentType: string): { ext: string; mime: string } {
  const map: Record<string, string> = {
    "audio/ogg": "ogg",
    "audio/opus": "ogg",
    "audio/amr": "amr",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/wav": "wav",
  };
  const clean = contentType.split(";")[0].trim().toLowerCase();
  const ext = map[clean] || "ogg";
  return { ext, mime: clean || "audio/ogg" };
}

async function extractTransaction(text: string, userName: string, accountCurrency: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a highly intelligent multilingual financial assistant embedded in a WhatsApp bot.\n" +
            `The user's name is "${userName}" and their account's default currency is ${accountCurrency}.\n\n` +
            "Analyze the user's message, which may be written in English, Sinhala script, or Singlish (romanized Sinhala).\n" +
            "1. Detect the primary language of the message and set \"language\" to \"en\" (English or Latin-script Singlish) or \"si\" (Sinhala script).\n" +
            "2. Determine if the user wants to log a normal transaction OR set/update a budget limit.\n" +
            "   If they say something like 'food budget 5000' or 'කෑම වලට 5000ක් බජට් සෙට් කරපන්', classify it as 'set_budget'.\n" +
            "   Otherwise classify it as 'log_transaction'.\n" +
            "3. Determine the most matching category: [Food, Transport, Bills, Shopping, Entertainment, Medical, Education, Salary, Loan, Other].\n\n" +
            "--- LOAN LOGIC (CRITICAL) ---\n" +
            "1. If they gave money as a loan (e.g., 'gave 5000 to Kasun', 'කසුන්ට 5000ක් ණයට දුන්නා'), type is 'loan_given'. Extract person name.\n" +
            "2. If they borrowed money (e.g., 'took 2000 from Kasun', 'කසුන්ගෙන් 2000ක් ගත්තා', 'කසුන්ගෙන් 2000ක් ණයට ගත්තා'), type is 'loan_taken'. Extract person name.\n" +
            "3. If someone is paying back/settling a loan (e.g., 'Kasun paid back 5000', 'කසුන් ණය බේරුවා 5000ක්', 'කසුන්ගෙන් 5000 ලැබුණා'), type is 'loan_settled'. Extract person name.\n\n" +
            "4. If a currency symbol or code is explicitly mentioned in the message (e.g. '$', 'USD', 'Rs.', 'LKR'), use that as \"currency\". Otherwise default to the account currency given above.\n\n" +
            "Response MUST be in JSON format:\n" +
            "{\n" +
            '  "action": "log_transaction" | "set_budget",\n' +
            '  "type": "expense" | "income" | "loan_given" | "loan_taken" | "loan_settled" | null,\n' +
            '  "item": "string",\n' +
            '  "category": "string",\n' +
            '  "amount": number,\n' +
            '  "person": "string" | null,\n' +
            '  "currency": "string",\n' +
            '  "language": "en" | "si"\n' +
            "}",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (err) {
    console.error("❌ AI Extraction Error:", err);
    return null;
  }
}

async function extractFromImage(
  mediaUrl: string,
  contentType: string,
  twilioSid: string,
  twilioToken: string,
  userName: string,
  accountCurrency: string,
  preferredLanguage: string
) {
  try {
    const response = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
      auth: { username: twilioSid, password: twilioToken },
      timeout: 15000,
    });

    const base64Image = Buffer.from(response.data).toString("base64");

    const openAiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert financial assistant. Analyze the provided receipt/bill image and extract the total bill amount, " +
            "the store/shop/bill name, and classify the category. " +
            "The category MUST be one of these: [Food, Transport, Bills, Shopping, Entertainment, Medical, Education, Salary, Loan, Other]. " +
            `If a currency symbol is visible on the receipt, use it; otherwise default to ${accountCurrency}.\n\n` +
            `The user's name is "${userName}". Write the "bot_reply" field in the language code "${preferredLanguage}" ` +
            "(\"si\" = Sinhala script, \"en\" = English), addressing the user by name, stating the amount and category, ending with ✅. " +
            `Also write a one-line "action_hint" in the same language telling the user to reply Confirm to save or Edit to fix it.\n\n` +
            "Response MUST be in JSON format:\n" +
            "{\n" +
            '  "action": "log_transaction",\n' +
            '  "type": "expense",\n' +
            '  "item": "string",\n' +
            '  "category": "string",\n' +
            '  "amount": number,\n' +
            '  "person": null,\n' +
            '  "currency": "string",\n' +
            `  "language": "${preferredLanguage}",\n` +
            '  "bot_reply": "string",\n' +
            '  "action_hint": "string"\n' +
            "}",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Carefully look at this receipt and extract the total bill amount, the store/merchant name, and the most logical category. Convert the response strictly to JSON.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${contentType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(openAiResponse.choices[0].message.content || "{}");
  } catch (err) {
    console.error("❌ Vision Image Processing Error:", err);
    return null;
  }
}

function buildTransactionPreview(txData: any, language: string, userName: string): string {
  const currency = txData.currency || "";
  const amountStr = `${currency} ${txData.amount}`.trim();
  const person = txData.person || "Unknown";

  let typeLine = "";
  if (txData.type === "loan_given") {
    typeLine = language === "si"
      ? `🤝 Type: *Loan Given (ණයට දුන්නා)* 🔴\n👤 Person: *${person}*\n`
      : `🤝 Type: *Loan Given* 🔴\n👤 Person: *${person}*\n`;
  } else if (txData.type === "loan_taken") {
    typeLine = language === "si"
      ? `🤝 Type: *Loan Taken (ණයට ගත්තා)* 🟢\n👤 Person: *${person}*\n`
      : `🤝 Type: *Loan Taken* 🟢\n👤 Person: *${person}*\n`;
  } else if (txData.type === "loan_settled") {
    typeLine = language === "si"
      ? `🤝 Type: *Loan Settle (ණය පියවීම)* 🟢\n👤 Person: *${person}*\n`
      : `🤝 Type: *Loan Settled* 🟢\n👤 Person: *${person}*\n`;
  } else if (txData.type === "income") {
    typeLine = language === "si"
      ? `💰 Type: *Income (ආදායම)* 🟢\n`
      : `💰 Type: *Income* 🟢\n`;
  } else {
    typeLine = language === "si"
      ? `💸 Type: *Expense (වියදම)* 🔴\n`
      : `💸 Type: *Expense* 🔴\n`;
  }

  const intro = language === "si"
    ? `📝 ${userName}, මම මේක track කරගත්තා:\n\n`
    : `📝 ${userName}, I've tracked this:\n\n`;

  return (
    intro +
    `📝 Description: *${txData.item}*\n` +
    `🗂️ Category: *${txData.category}*\n` +
    typeLine +
    `💵 Amount: *${amountStr}*\n\n` +
    actionFooter(language)
  );
}

// ============================================================
// 💾 SESSION HELPERS  (this is the part that was fixed)
// ============================================================
// FIX #1: the original code called .upsert() but never checked the
// returned `error`, and never confirmed the row actually landed.
// If the upsert silently failed (bad `onConflict` target, RLS policy,
// schema mismatch, etc.) the user would see the "I've tracked this"
// preview even though nothing was saved — then "Confirm" would find
// nothing. Now we check the error AND log exactly what got written.
async function savePendingTransaction(phoneNumber: string, txData: any) {
  const { data, error } = await supabase
    .from("user_sessions")
    .upsert(
      {
        phone_number: phoneNumber,
        pending_transaction: txData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "phone_number" }
    )
    .select("phone_number, pending_transaction")
    .maybeSingle();

  if (error) {
    console.error("❌ Failed to save pending_transaction to user_sessions:", error);
    return { success: false };
  }

  console.log("💾 DEBUG SESSION DATA (saved):", JSON.stringify(data));
  return { success: true, data };
}

// FIX #2: use maybeSingle() instead of single(). single() throws a
// Postgrest error (PGRST116) when zero rows match, which added noise
// and made it harder to tell "no session yet" apart from a real DB
// error. maybeSingle() just returns null cleanly in that case.
async function getPendingTransaction(phoneNumber: string) {
  const { data, error } = await supabase
    .from("user_sessions")
    .select("pending_transaction")
    .eq("phone_number", phoneNumber)
    .maybeSingle();

  console.log(
    "🔎 DEBUG SESSION DATA (read):",
    JSON.stringify({ phoneNumber, data, error })
  );

  return { data, error };
}

// ✅ Database Save & Quick Budget Status
async function handleConfirmTransaction(phoneNumber: string, userName: string, language: string) {
  try {
    const { data: session, error: sessionError } = await getPendingTransaction(phoneNumber);

    if (sessionError) {
      console.error("❌ Error reading session:", sessionError);
    }

    if (!session?.pending_transaction) {
      return {
        success: false,
        message: language === "si"
          ? `${userName}, කන්ෆර්ම් කරන්න කිසිම ගනුදෙනුවක් හම්බවුණේ නැහැ! 🧐`
          : `${userName}, I couldn't find any transaction to confirm! 🧐`
      };
    }

    const pendingTx = session.pending_transaction;

    const { error: insertError } = await supabase
      .from('transactions')
      .insert([
        {
          phone_number: phoneNumber,
          type: pendingTx.type,
          item: pendingTx.item,
          category: pendingTx.category,
          amount: pendingTx.amount,
          person: pendingTx.person,
          currency: pendingTx.currency || 'LKR'
        }
      ]);

    if (insertError) throw insertError;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthStr = startOfMonth.toISOString();

    const { data: categoryTxs } = await supabase
      .from('transactions')
      .select('amount')
      .eq('phone_number', phoneNumber)
      .eq('type', 'expense')
      .eq('category', pendingTx.category)
      .gte('created_at', startOfMonthStr);

    const totalCategoryExpense = categoryTxs?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

    const { data: budgetData } = await supabase
      .from('budgets')
      .select('amount_limit')
      .eq('phone_number', phoneNumber)
      .eq('category', pendingTx.category)
      .gte('created_at', startOfMonthStr)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currency = pendingTx.currency || 'LKR';

    let budgetFeedback = "";
    if (budgetData) {
      const limit = budgetData.amount_limit;
      if (totalCategoryExpense > limit) {
        budgetFeedback = language === "si"
          ? `\n\n🚨 *බජට් එක පැන්නා මචං!* ඔයා මේ මාසේ *${pendingTx.category}* බජට් එක (${currency} ${limit}) සීමාව පන්නලා තියෙන්නේ! (මුළු වියදම: ${currency} ${totalCategoryExpense})`
          : `\n\n🚨 *Budget exceeded!* You've gone over your *${pendingTx.category}* budget (${currency} ${limit}) for this month! (Total spent: ${currency} ${totalCategoryExpense})`;
      } else {
        const remaining = limit - totalCategoryExpense;
        budgetFeedback = language === "si"
          ? `\n\n🎯 *${pendingTx.category}* බජට් එකෙන් තව *${currency} ${remaining}* ඉතුරුයි.`
          : `\n\n🎯 You have *${currency} ${remaining}* left in your *${pendingTx.category}* budget.`;
      }
    }

    await supabase.from('user_sessions').delete().eq('phone_number', phoneNumber);

    const successMessage = language === "si"
      ? `✅ සිරාවටම සේව් කරගත්තා ${userName}!\n\n` +
        `💠 *${pendingTx.item}* _(${pendingTx.category})_\n` +
        `💰 *${currency} ${pendingTx.amount}*` + budgetFeedback
      : `✅ Saved, ${userName}!\n\n` +
        `💠 *${pendingTx.item}* _(${pendingTx.category})_\n` +
        `💰 *${currency} ${pendingTx.amount}*` + budgetFeedback;

    return { success: true, message: successMessage };

  } catch (error) {
    console.error("Error confirming transaction:", error);
    return {
      success: false,
      message: language === "si"
        ? `${userName}, ඩේටාබේස් එකට සේව් වෙද්දී පොඩි අවුලක් ගියා! 🚨`
        : `${userName}, something went wrong saving that to the database! 🚨`
    };
  }
}

// ---- Main Route ----

export async function POST(req: NextRequest) {
  try {
    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    if (!TWILIO_SID || !TWILIO_TOKEN || !OPENAI_KEY) {
      console.error("❌ Missing env vars");
      return new NextResponse("Server configuration error", { status: 500 });
    }

    const formData = await req.formData();
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const mediaUrl = formData.get("MediaUrl0") as string | null;
    const mediaContentType = (formData.get("MediaContentType0") as string) || "audio/ogg";
    const body = ((formData.get("Body") as string) || "").trim();

    console.log("⚡ --- නව WhatsApp මැසේජ් එකක් ආවා --- ⚡");
    console.log(`👤 From: ${from} | 💬 Body: ${body}`);

    // ==========================================
    // 0. ONBOARDING GATE (Strictly English)
    // ==========================================
    let user = await getUser(from);

    if (!user) {
      user = await createUser(from);
      await twilioClient.messages.create({
        from: to,
        to: from,
        body: "👋 Welcome! I'm your zero-friction expense tracker.\n\nWhat should I call you?",
      });
      return new NextResponse("OK", { status: 200 });
    }

    if (user.status !== "active") {
      await handleOnboarding(user, body, from, to);
      return new NextResponse("OK", { status: 200 });
    }

    const userName = user.name || "there";
    const accountCurrency = user.currency || "USD";
    const preferredLanguage = user.preferred_language || "en";

    const normalizedBody = body.toLowerCase();

    // ==========================================
    // 1. CONFIRMATION & COMMANDS
    // ==========================================
    if (normalizedBody.includes("confirm")) {
      console.log(`✅ ${from} ගේ Transaction එක Confirm කරන්න හදන්නේ...`);
      const result = await handleConfirmTransaction(from, userName, preferredLanguage);

      await twilioClient.messages.create({
        from: to,
        to: from,
        body: result.message
      });

      return new NextResponse("OK", { status: 200 });
    }

    if (normalizedBody.includes("edit")) {
      console.log(`✏️ ${from} ට එඩිට් කරන්න ඕන වෙලා. Session එක clear කරනවා.`);
      await supabase.from('user_sessions').delete().eq('phone_number', from);

      await twilioClient.messages.create({
        from: to,
        to: from,
        body:
          `හරි මචං, වැරදුණු තැන හදලා මෙන්න මේ විදිහට ආයෙත් මැසේජ් එකක් දාන්න:\n\n` +
          `*"[විස්තරය] [ගාණ]"*\n` +
          `(උදා: අමිලට 5000ක් දුන්නා)`
      });

      return new NextResponse("OK", { status: 200 });
    }

    // 📊 MANUAL BUDGET CHECK ("budget", "summary" හෝ "බජට්")
    if (normalizedBody === "budget" || normalizedBody === "summary" || normalizedBody === "බජට්") {
      console.log(`📊 ${from} ගේ Budget Summary එක ගන්නවා...`);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const startOfMonthStr = startOfMonth.toISOString();

      const { data: txs } = await supabase
        .from('transactions')
        .select('type, amount, category')
        .eq('phone_number', from)
        .gte('created_at', startOfMonthStr);

      const { data: budgetLimits } = await supabase
        .from('budgets')
        .select('category, amount_limit')
        .eq('phone_number', from)
        .gte('created_at', startOfMonthStr);

      let totalIncome = 0;
      let totalExpense = 0;
      const categoryTotals: Record<string, number> = {};

      txs?.forEach(tx => {
        if (tx.type === 'income') {
          totalIncome += tx.amount;
        } else if (tx.type === 'expense') {
          totalExpense += tx.amount;
          categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
        }
      });

      let breakdown = "";
      if (budgetLimits && budgetLimits.length > 0) {
        breakdown += `🎯 *සෙට් කරපු බජට් සීමාවන්*\n`;
        budgetLimits.forEach(b => {
          const spent = categoryTotals[b.category] || 0;
          const limit = b.amount_limit;
          const diff = limit - spent;
          const status = diff >= 0 ? `✅ Rs. ${diff} ඉතුරුයි` : `🚨 Rs. ${Math.abs(diff)} පැන්නා!`;
          breakdown += `• *${b.category}:* Rs. ${spent} / Rs. ${limit} — ${status}\n`;
        });
      } else {
        breakdown += `📂 *වියදම් බෙදී ගිය හැටි*\n`;
        for (const [cat, amt] of Object.entries(categoryTotals)) {
          breakdown += `• *${cat}:* Rs. ${amt}\n`;
        }
      }

      const remaining = totalIncome - totalExpense;

      const responseMsg =
        `📊 *මෙන්න මේ මාසේ බජට් එක, මචං!*\n\n` +
        `💵 මුළු ආදායම: *Rs. ${totalIncome}*\n` +
        `💸 මුළු වියදම: *Rs. ${totalExpense}*\n` +
        `⚖️ ඉතිරි මුළු මුදල: *Rs. ${remaining}*\n\n` +
        `${breakdown || "තවම ගනුදෙනු කිසිවක් සිදුකර නැත."}`;

      await twilioClient.messages.create({
        from: to,
        to: from,
        body: responseMsg
      });

      return new NextResponse("OK", { status: 200 });
    }

    // 🤝 DEBT / LOAN LEDGER ("loans" හෝ "ණය")
    if (normalizedBody === "loans" || normalizedBody === "ණය") {
      console.log(`🤝 ${from} ගේ ණය ලෙජරය (Loans) කැල්කියුලේට් කරනවා...`);

      const { data: loanTxs } = await supabase
        .from('transactions')
        .select('type, amount, person')
        .eq('phone_number', from)
        .in('type', ['loan_given', 'loan_taken', 'loan_settled']);

      let totalReceivable = 0;
      let totalPayable = 0;
      const personBalances: Record<string, number> = {};

      loanTxs?.forEach(tx => {
        const personName = tx.person ? tx.person.trim() : "Unknown";
        const amount = tx.amount;

        if (tx.type === 'loan_given') {
          personBalances[personName] = (personBalances[personName] || 0) + amount;
        } else if (tx.type === 'loan_taken') {
          personBalances[personName] = (personBalances[personName] || 0) - amount;
        } else if (tx.type === 'loan_settled') {
          const currentBalance = personBalances[personName] || 0;
          if (currentBalance > 0) {
            personBalances[personName] = currentBalance - amount;
          } else if (currentBalance < 0) {
            personBalances[personName] = currentBalance + amount;
          } else {
            personBalances[personName] = -amount;
          }
        }
      });

      Object.entries(personBalances).forEach(([person, bal]) => {
        if (bal > 0) {
          totalReceivable += bal;
        } else if (bal < 0) {
          totalPayable += Math.abs(bal);
        }
      });

      let breakdown = "";
      const people = Object.keys(personBalances);

      if (people.length > 0) {
        breakdown += `\n👤 *පුද්ගලයන් අනුව විස්තරය*\n`;
        people.forEach(person => {
          const balance = personBalances[person];
          if (balance > 0) {
            breakdown += `• *${person}:* Rs. ${balance} ඔයාට ලැබෙන්න තියෙනවා 🟢\n`;
          } else if (balance < 0) {
            breakdown += `• *${person}:* Rs. ${Math.abs(balance)} ඔයා දෙන්න ඕනේ 🔴\n`;
          } else {
            breakdown += `• *${person}:* සේරම ණය බේරා ඇත! ✅ (Rs. 0)\n`;
          }
        });
      }

      const responseMsg =
        `🤝 *මෙන්න ඔයාගේ ණය ගනුදෙනු ලෙජරය, මචං!*\n\n` +
        `🟢 ලැබෙන්න තියෙන මුළු මුදල: *Rs. ${totalReceivable}*\n` +
        `🔴 ගෙවන්න තියෙන මුළු මුදල: *Rs. ${totalPayable}*\n` +
        `⚖️ ශේෂය (Net Debt): *Rs. ${totalReceivable - totalPayable}*\n` +
        `${breakdown || "\nසටහන් කරගත් ණය ගනුදෙනු කිසිවක් නැත."}`;

      await twilioClient.messages.create({
        from: to,
        to: from,
        body: responseMsg
      });

      return new NextResponse("OK", { status: 200 });
    }

    // 📈 CSV EXPORT COMMAND ("export" හෝ "එක්ස්පෝට්")
    if (normalizedBody === "export" || normalizedBody === "එක්ස්පෝට්") {
      console.log(`📈 ${from} ගේ ඩේටා ටික CSV එකකට Export කරනවා...`);

      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('created_at, item, category, type, amount, person, currency')
        .eq('phone_number', from)
        .order('created_at', { ascending: false });

      if (txError || !txs || txs.length === 0) {
        await twilioClient.messages.create({
          from: to,
          to: from,
          body: "📊 මචං, ඔයාගේ එකවුන්ට් එකේ සේව් වුණු ගනුදෙනු කිසිවක් තවම නැහැ Export කරගන්න!"
        });
        return new NextResponse("OK", { status: 200 });
      }

      const csvHeaders = "Date,Description,Category,Type,Amount,Person,Currency\n";
      const csvRows = txs.map(tx => {
        const formattedDate = new Date(tx.created_at).toISOString().split('T')[0];
        const cleanDesc = (tx.item || "").replace(/"/g, '""');
        return `"${formattedDate}","${cleanDesc}","${tx.category}","${tx.type}",${tx.amount},"${tx.person || ''}","${tx.currency}"`;
      }).join("\n");

      const csvContent = csvHeaders + csvRows;
      const fileName = `transactions_${from.replace(/[^0-9]/g, "")}.csv`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('exports')
        .upload(fileName, Buffer.from(csvContent), {
          contentType: 'text/csv',
          upsert: true
        });

      if (uploadError) {
        console.error("❌ Supabase Upload Error:", uploadError);
        await twilioClient.messages.create({
          from: to,
          to: from,
          body: "🚨 අප්පට සිරි, Excel/CSV ෆයිල් එක හදාගන්න පොඩි අවුලක් ගියා මචං. පස්සේ ට්‍රයි කරමුද?"
        });
        return new NextResponse("OK", { status: 200 });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('exports')
        .getPublicUrl(fileName);

      await twilioClient.messages.create({
        from: to,
        to: from,
        body: "📊 මෙන්න මචං ඔයා ඉල්ලපු සේරම Transactions ටික අඩංගු Excel/CSV ලෙජරය!",
        mediaUrl: [publicUrl]
      });

      return new NextResponse("OK", { status: 200 });
    }

    // ==========================================
    // 2. DATA PROCESSING (VOICE, IMAGE OR TEXT)
    // ==========================================
    let userText = body;
    let txData = null;

    if (mediaUrl) {
      if (mediaContentType.startsWith("audio/")) {
        console.log(`🎙️ Voice Note එකක් අහුවුණා. URL: ${mediaUrl}`);

        try {
          const audioResponse = await axios.get(mediaUrl, {
            responseType: "arraybuffer",
            auth: { username: TWILIO_SID, password: TWILIO_TOKEN },
            timeout: 15000,
          });

          const actualContentType = (audioResponse.headers["content-type"] as string) || mediaContentType;
          const { ext, mime } = getExtensionFromContentType(actualContentType);
          const audioBuffer = Buffer.from(audioResponse.data);

          const audioBlob = new Blob([audioBuffer], { type: mime });
          const openAiFormData = new FormData();
          openAiFormData.append("file", audioBlob, `input.${ext}`);
          openAiFormData.append("model", "gpt-4o-transcribe");
          openAiFormData.append(
            "prompt",
            "This voice note may contain a mix of Sinhala and English words. Transcribe English words in Latin script and Sinhala words in Sinhala script."
          );
          openAiFormData.append("response_format", "json");

          const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${OPENAI_KEY}` },
            body: openAiFormData,
          });

          if (!whisperResponse.ok) throw new Error("Whisper failed");

          const transcription = await whisperResponse.json();
          userText = (transcription.text || "").trim();
          console.log(`📝 Transcribed Text: ${userText}`);

          if (userText && !userText.startsWith("[")) {
            txData = await extractTransaction(userText, userName, accountCurrency);
          }

        } catch (audioError: any) {
          console.error("❌ Audio Processing Error:", audioError);
          await twilioClient.messages.create({
            from: to,
            to: from,
            body: preferredLanguage === "si"
              ? "😔 Audio එක කියවා ගැනීමට නොහැකි විය. නැවත උත්සාහ කරන්න."
              : "😔 Sorry, I couldn't process that voice note. Please try again."
          });
          return new NextResponse("OK", { status: 200 });
        }
      }
      else if (mediaContentType.startsWith("image/")) {
        console.log(`📸 Image (Bill) එකක් අහුවුණා. URL: ${mediaUrl}`);

        await twilioClient.messages.create({
          from: to,
          to: from,
          body: preferredLanguage === "si"
            ? `📸 ${userName}, මම ඔයා එවපු බිල්පත කියවමින් ඉන්නේ. තත්පරයක් දෙන්න... ⏳`
            : `📸 ${userName}, I'm reading your receipt now. One sec... ⏳`
        });

        txData = await extractFromImage(
          mediaUrl,
          mediaContentType,
          TWILIO_SID,
          TWILIO_TOKEN,
          userName,
          accountCurrency,
          preferredLanguage
        );
        console.log("🤖 OpenAI Image Extracted Data:", txData);
      }
    }
    else if (userText && !userText.startsWith("[")) {
      txData = await extractTransaction(userText, userName, accountCurrency);
      console.log("🤖 OpenAI Extracted Data:", txData);
    }

    if (txData?.language && txData.language !== preferredLanguage) {
      await updateUser(from, { preferred_language: txData.language });
    }

    // ==========================================
    // 3. REPLY GENERATION
    // ==========================================
    if (txData && txData.amount) {

      if (txData.action === "set_budget") {
        console.log(`🎯 ${from} ගේ ${txData.category} බජට් එක සෙට් කරනවා: Rs. ${txData.amount}`);

        const { error: budgetError } = await supabase
          .from('budgets')
          .upsert(
            {
              phone_number: from,
              category: txData.category || 'Other',
              amount_limit: txData.amount
            },
            { onConflict: 'phone_number,category' }
          );

        if (budgetError) throw budgetError;

        const budgetMsg = txData.language === "si"
          ? `🎯 හරි ${userName}, මම මේ මාසෙට *${txData.category}* බජට් සීමාව *${txData.currency} ${txData.amount}* විදිහට සෙට් කරගත්තා! 🚀`
          : `🎯 Done, ${userName}! Your *${txData.category}* budget for this month is now *${txData.currency} ${txData.amount}* 🚀`;

        await twilioClient.messages.create({
          from: to,
          to: from,
          body: budgetMsg
        });

        return new NextResponse("OK", { status: 200 });
      }

      console.log(`💾 තාවකාලිකව data ටික user_sessions එකට දානවා...`);

      // FIX: check the save result. If it failed, tell the user instead
      // of silently showing a preview for a transaction that was never
      // actually persisted (which is what caused "Confirm" to fail).
      const saveResult = await savePendingTransaction(from, txData);

      if (!saveResult.success) {
        await twilioClient.messages.create({
          from: to,
          to: from,
          body: preferredLanguage === "si"
            ? `😔 ${userName}, මේ transaction එක තාවකාලිකව save කරගන්න බැරි වුණා. ආයෙත් ට්‍රයි කරන්න.`
            : `😔 ${userName}, I couldn't save that transaction for review. Please try sending it again.`
        });
        return new NextResponse("OK", { status: 200 });
      }

      const replyBody = buildTransactionPreview(txData, txData.language || preferredLanguage, userName);

      await twilioClient.messages.create({
        from: to,
        to: from,
        body: replyBody
      });

    } else {
      await twilioClient.messages.create({
        from: to,
        to: from,
        body: preferredLanguage === "si"
          ? `😕 මට පැහැදිලිව ගනුදෙනුවක් හෝ බජට් එකක් අඳුරගන්න බැරි වුණා ${userName}.\n\nට්‍රයි කරන්න:\n• "බස් එකට 200ක් ගියා"\n• "Food budget 5000"\n• බිල්පතක photo එකක්`
          : `😕 Sorry ${userName}, I couldn't quite understand that as a transaction or budget.\n\nTry something like:\n• "Spent $15 on lunch"\n• "Food budget 5000"\n• A photo of a receipt`
      });
    }

    return new NextResponse("OK", { status: 200 });

  } catch (error: any) {
    console.error("❌ Webhook Error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}