import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { OpenAI } from "openai";
import { supabase } from "@/lib/supabase"; 
import twilio from "twilio";
import FormFormat from "form-data";
import { checkAndResetDailyLimits } from "@/lib/resetLimits";

// Types Definition
interface ExtractedData {
  action: "log_transaction" | "set_budget" | "set_starting_balance";
  type: "expense" | "income" | "loan_given" | "loan_taken" | "loan_settled" | null;
  item: string;
  category: string;
  amount: number;
  person: string | null;
  currency: string;
  confirmation_message?: string;
}

interface LocalizedMessages {
  welcome: string;
  guidelines: string;
  proFeatureImage: string;
  proFeatureVoice: string;
  limitReached: string;
  noPending: string;
  budgetSaved: string;
  savedMsg: string;
  autoSavedMsg: string;
  dbError: string;
  directError: string;
  editCancel: string;
  fallback: string;
  preview: string;
  typeIncome: string;
  typeExpense: string;
  // NEW LIMIT MESSAGES
  dailyTxLimitReached: string;
  dailyOcrLimitReached: string;
  dailyVoiceLimitReached: string;
  // VOICE LANGUAGE VALIDATION
  voiceLangMismatch: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const TWILIO_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

// In-memory Translation Cache
const translationCache = new Map<string, LocalizedMessages>();

// 🌍 ULTIMATE FORMATTED MULTI-LANGUAGE SYSTEM MESSAGES
async function getLocalizedMessages(
  lang: string, 
  nickname: string, 
  currency: string, 
  websiteUrl: string, 
  contextData: { amount?: string; item?: string; isIncome?: boolean; typeTag?: string; category?: string; language?: string } = {}
): Promise<LocalizedMessages> {
  const targetLang = (lang || "English").trim();
  const key = targetLang.toLowerCase();

  // Base English Template with Placeholders
  const ENGLISH_TEMPLATE: LocalizedMessages = {
    welcome: `👋 Welcome, {NICKNAME}!\n\nI'm *Brofinai*, your Personal Finance Assistant — here to help you track and manage your money with ease. 🚀\n\nTo get started, please share your current **Starting Balance / Capital**.\n\n💡 Example: *"50000"* or *"25000"*`,
    guidelines: `🎯 Great, {NICKNAME}! Your **Starting Balance** has been set to *{CURRENCY} {AMOUNT}*. 🎉\n\n--- 💡 *Brofinai Quick Guide* ---\n\n💸 *Log an Expense:*\n| "Spent 500 for lunch" / "Bus fare 80"\n\n💰 *Log an Income:*\n| "Got salary 150000" / "Got bonus 10000"\n\n🎯 *Set a Monthly Budget:*\n| "Set budget 50000"\n\n🚀 You're all set — send your first expense or income to begin tracking!`,
    proFeatureImage: `🔒 *Pro Feature: AI Receipt Scanning*\n\nHey {NICKNAME}, you've hit your scan limit for now. Upgrade to Broo Core or Max to unlock more scans:\n👉 {WEBSITE}/#pricing`,
    proFeatureVoice: `🔒 *Pro Feature: Voice Notes*\n\nHey {NICKNAME}, voice tracking is available on Broo Core or Max. Upgrade to unlock it:\n👉 {WEBSITE}/#pricing`,
    limitReached: `⚠️ *Monthly Receipt Limit Reached (30/30 Scans)*\n\nHey {NICKNAME}, you've used up all your scans for this month. Upgrade to BROO MAX for unlimited scanning:\n👉 {WEBSITE}/#pricing`,
    noPending: `⚠️ Hey {NICKNAME}, there's no pending transaction to confirm right now!`,
    budgetSaved: `🎯 Nice one, {NICKNAME}! Your monthly budget is now set to *{CURRENCY} {AMOUNT}*. 🎉`,
    savedMsg: `✅ Got it, {NICKNAME}! Saved *{CURRENCY} {AMOUNT}* for *{ITEM}* under *{CATEGORY}*. 🚀`,
    autoSavedMsg: `⚡ *Auto-Saved!*\n\nNice, {NICKNAME}! I've saved *{CURRENCY} {AMOUNT}* for *{ITEM}*. 🚀`,
    dbError: `🚨 Oops, something went wrong while saving that. Please try again in a moment.`,
    directError: `🚨 Something went wrong during the auto-save. Please try again.`,
    editCancel: `No worries, {NICKNAME}! Go ahead and send the corrected details.`,
    fallback: `Hmm, I couldn't quite catch that, {NICKNAME}. Try something like "Spent 500 for lunch"! 🚀`,
    preview: `📝 Description: *{ITEM}*\n🏷️ Type: *{TYPETAG}*\n🗂️ Category: *{CATEGORY}*\n💰 Amount: *{CURRENCY} {AMOUNT}*\n\n-> Reply *Confirm* to save.\n-> Reply *Edit* to make changes.`,
    typeIncome: `🟢 Income`,
    typeExpense: `🔴 Expense`,
    // NEW LIMIT MESSAGES (ENGLISH)
    dailyTxLimitReached: `⚠️ *Daily Transaction Limit Reached!*\n\nHey {NICKNAME}, you've hit your plan's daily transaction limit.\n\n🚀 Upgrade to Broo Core or Max for unlimited tracking:\n👉 {WEBSITE}/#pricing`,
    dailyOcrLimitReached: `⚠️ *Daily Receipt Scan Limit Reached (1/1 Scan)*\n\nHey {NICKNAME}, upgrade to BROO CORE (30 scans/mo) or BROO MAX (unlimited) for more scanning power:\n👉 {WEBSITE}/#pricing`,
    dailyVoiceLimitReached: `⚠️ *Daily Voice Limit Reached (5/5 Notes)*\n\nHey {NICKNAME}, upgrade to BROO MAX for unlimited voice tracking:\n👉 {WEBSITE}/#pricing`,
    // VOICE LANGUAGE VALIDATION (ENGLISH)
    voiceLangMismatch: `🎤 *Language Not Recognized*\n\nHey {NICKNAME}, I couldn't clearly understand that voice note. Please speak in *{LANGUAGE}* or *English* so I can process it accurately. 🙏`,
  };

  // 1. SINGLISH FORMATTED TEMPLATE
  if (key === "singlish") {
    const SINGLISH_TEMPLATE: LocalizedMessages = {
      welcome: `👋 සාදරයෙන් පිළිගන්නවා, {NICKNAME}!\n\nමම ඔබේ Personal Finance Assistant *Brofinai*. ඔබේ මුදල් කළමනාකරණය පහසු කර දීමට මම මෙතන ඉන්නවා. 🚀\n\nපටන් ගැනීමට, ඔබේ ගිණුමේ දැනට ඇති **ආරම්භක මුදල (Starting Balance / Capital)** කීයද කියලා සඳහන් කරන්න.\n\n💡 උදාහරණ: *"50000"* හෝ *"25000"*`,
      guidelines: `🎯 සුභ පැතුම්, {NICKNAME}! ඔබේ Starting Balance එක *{CURRENCY} {AMOUNT}* ලෙස සකසා ඇත. 🎉\n\n--- 💡 *Brofinai Quick Guide* ---\n\n💸 *Expense එකක් Log කරන්න:*\n| "Spent 500 for lunch" / "Bus fare 80"\n\n💰 *Income එකක් Log කරන්න:*\n| "Got salary 150000" / "Got bonus 10000"\n\n🎯 *Monthly Budget එකක් Set කරන්න:*\n| "Set budget 50000"\n\n🚀 ඔබේ පළමු Expense එක හෝ Income එක එවා Tracking ආරම්භ කරන්න!`,
      proFeatureImage: `🔒 *AI Receipt Scanning - Pro Feature*\n\n{NICKNAME}, ඔබේ Scan Limit එක අවසන් වෙලා. තව Scans ලබාගන්න Broo Core හෝ Max plan එකකට Upgrade වෙන්න:\n👉 {WEBSITE}/#pricing`,
      proFeatureVoice: `🔒 *Voice Notes - Pro Feature*\n\n{NICKNAME}, Voice Tracking පහසුකම තියෙන්නෙ Broo Core සහ Max Plan වල විතරයි. Upgrade වෙලා try කරන්න:\n👉 {WEBSITE}/#pricing`,
      limitReached: `⚠️ *Monthly Receipt Limit Reached (30/30 Scans)*\n\n{NICKNAME}, මේ මාසෙට ඔබේ Scans ඔක්කොම භාවිත වෙලා ඉවරයි. Unlimited Scans සඳහා **BROO MAX** එකට Upgrade වෙන්න:\n👉 {WEBSITE}/#pricing`,
      noPending: `⚠️ {NICKNAME}, දැනට Confirm කරන්න පොරොත්තු Transaction එකක් නෑ!`,
      budgetSaved: `🎯 සුභ පැතුම්, {NICKNAME}! ඔබේ මාසික Budget එක *{CURRENCY} {AMOUNT}* ලෙස සකසා ඇත. 🎉`,
      savedMsg: `✅ හරි, {NICKNAME}! *{ITEM}* (*{CATEGORY}*) සඳහා *{CURRENCY} {AMOUNT}* Save කරගත්තා. 🚀`,
      autoSavedMsg: `⚡ *Auto Saved!* (Broo Max Feature)\n\nහරි, {NICKNAME}! *{ITEM}* සඳහා *{CURRENCY} {AMOUNT}* Save කරගත්තා. 🚀`,
      dbError: `🚨 Database එකට Save කරද්දී අවුලක් සිදුවුණා, {NICKNAME}. කරුණාකර ටිකකින් ආයෙත් Try කරන්න.`,
      directError: `🚨 Auto-Save කරද්දී අවුලක් සිදුවුණා. කරුණාකර ආයෙත් Try කරන්න.`,
      editCancel: `කමක් නෑ, {NICKNAME}! නිවැරදි විස්තර ආයෙත් එවන්න.`,
      fallback: `Sorry, {NICKNAME}, ඒක මට හරියටම තේරුණේ නෑ. "Spent 500 for lunch" වගේ එකක් Try කරන්න! 🚀`,
      preview: `📝 විස්තරය: *{ITEM}*\n🏷️ වර්ගය: *{TYPETAG}*\n🗂️ කාණ්ඩය: *{CATEGORY}*\n💰 ගාණ: *{CURRENCY} {AMOUNT}*\n\n-> Save කරන්න *Confirm* කියලා Reply කරන්න.\n-> වෙනස් කරන්න *Edit* කියලා Reply කරන්න.`,
      typeIncome: `🟢 ආදායම`,
      typeExpense: `🔴 වියදම`,
      // NEW LIMIT MESSAGES (SINGLISH)
      dailyTxLimitReached: `⚠️ *Daily Transaction Limit Reached!*\n\n{NICKNAME}, ඔබේ Plan එකේ අද දවසේ Transaction Limit එක අවසන් වෙලා.\n\n🚀 Unlimited Tracking සඳහා Upgrade වෙන්න:\n👉 {WEBSITE}/#pricing`,
      dailyOcrLimitReached: `⚠️ *Daily Receipt Scan Limit Reached (1/1 Scan)*\n\n{NICKNAME}, තව Scans ලබාගැනීමට **BROO CORE** (මාසෙට 30) හෝ **BROO MAX** (Unlimited) එකට Upgrade වෙන්න:\n👉 {WEBSITE}/#pricing`,
      dailyVoiceLimitReached: `⚠️ *Daily Voice Limit Reached (5/5 Notes)*\n\n{NICKNAME}, Unlimited Voice Tracking සඳහා **BROO MAX** එකට Upgrade වෙන්න:\n👉 {WEBSITE}/#pricing`,
      // VOICE LANGUAGE VALIDATION (SINGLISH)
      voiceLangMismatch: `🎤 *Language Not Recognized*\n\n{NICKNAME}, ඔබේ Voice Note එක මට හරියටම තේරෙන්නෙ නෑ. කරුණාකර *{LANGUAGE}* හෝ *English* භාෂාවෙන් Clear ලෙස කතා කරන්න. 🙏`,
    };
    return fillTemplate(SINGLISH_TEMPLATE, nickname, currency, websiteUrl, contextData);
  }

  if (key === "english") {
    return fillTemplate(ENGLISH_TEMPLATE, nickname, currency, websiteUrl, contextData);
  }

  // Check Cache
  let rawTemplate: LocalizedMessages;
  if (translationCache.has(key)) {
    rawTemplate = translationCache.get(key)!;
  } else {
    try {
      const prompt = `You are translating WhatsApp UI message templates for "Brofinai" (a personal finance bot) into "${targetLang}".

Rules:
- Translate ONLY human-readable sentences into ${targetLang}.
- CRITICAL: KEEP THE WORDS "Confirm" AND "Edit" IN ENGLISH IN THE PREVIEW INSTRUCTION (e.g., "Reply Confirm to save / Reply Edit to change"). DO NOT TRANSLATE "Confirm" AND "Edit" COMMAND WORDS!
- NEVER translate or remove tokens inside curly braces: {NICKNAME}, {CURRENCY}, {AMOUNT}, {ITEM}, {WEBSITE}, {TYPETAG}, {CATEGORY}, {LANGUAGE}.
- Keep all formatting intact: *, _, |, ---, \\n, and emojis.
- Translate "typeIncome" and "typeExpense" (keep emoji prefix).
- Return pure JSON matching the template keys.

Source JSON:
${JSON.stringify(ENGLISH_TEMPLATE, null, 2)}`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const parsed = JSON.parse(res.choices[0].message.content || "{}");
      rawTemplate = { ...ENGLISH_TEMPLATE, ...parsed };
      translationCache.set(key, rawTemplate);
    } catch (err) {
      console.error(`❌ Translation Engine Error for ${targetLang}:`, err);
      rawTemplate = ENGLISH_TEMPLATE;
    }
  }

  return fillTemplate(rawTemplate, nickname, currency, websiteUrl, contextData);
}

// Helper: Replace Tokens in Template
function fillTemplate(
  template: LocalizedMessages,
  nickname: string,
  currency: string,
  websiteUrl: string,
  contextData: { amount?: string; item?: string; isIncome?: boolean; typeTag?: string; category?: string; language?: string }
): LocalizedMessages {
  const replacements: [string, string][] = [
    ["{NICKNAME}", nickname],
    ["{CURRENCY}", currency],
    ["{AMOUNT}", contextData.amount || "0"],
    ["{ITEM}", contextData.item || ""],
    ["{WEBSITE}", websiteUrl],
    ["{TYPETAG}", contextData.typeTag || ""],
    ["{CATEGORY}", contextData.category || ""],
    ["{LANGUAGE}", contextData.language || ""],
  ];

  const fill = (str: string) =>
    replacements.reduce((acc, [token, value]) => acc.split(token).join(value), str);

  return {
    welcome: fill(template.welcome),
    guidelines: fill(template.guidelines),
    proFeatureImage: fill(template.proFeatureImage),
    proFeatureVoice: fill(template.proFeatureVoice),
    limitReached: fill(template.limitReached),
    noPending: fill(template.noPending),
    budgetSaved: fill(template.budgetSaved),
    savedMsg: fill(template.savedMsg),
    autoSavedMsg: fill(template.autoSavedMsg),
    dbError: fill(template.dbError),
    directError: fill(template.directError),
    editCancel: fill(template.editCancel),
    fallback: fill(template.fallback),
    preview: fill(template.preview),
    typeIncome: template.typeIncome,
    typeExpense: template.typeExpense,
    dailyTxLimitReached: fill(template.dailyTxLimitReached),
    dailyOcrLimitReached: fill(template.dailyOcrLimitReached),
    dailyVoiceLimitReached: fill(template.dailyVoiceLimitReached),
    voiceLangMismatch: fill(template.voiceLangMismatch),
  };
}

// Helper: Map user's registered language to Whisper ISO code + comparable name
// Returns null for "Singlish" (mixed code-switched speech) so hinting/validation is skipped
function getWhisperLanguageInfo(userLang: string): { isoCode: string; name: string } | null {
  const key = (userLang || "").trim().toLowerCase();
  const map: Record<string, { isoCode: string; name: string }> = {
    english: { isoCode: "en", name: "english" },
    tamil: { isoCode: "ta", name: "tamil" },
    sinhala: { isoCode: "si", name: "sinhala" },
  };
  return map[key] || null;
}

// 1. 🎤 Voice to Text Transcriber
async function transcribeVoice(
  mediaUrl: string,
  twilioSid: string,
  twilioToken: string,
  languageHint?: string | null
): Promise<{ text: string; detectedLanguage: string } | null> {
  try {
    const response = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
      auth: { username: twilioSid, password: twilioToken },
      timeout: 15000,
    });

    const buffer = Buffer.from(response.data);
    const formData = new FormFormat();
    formData.append("file", buffer, { filename: "voice.ogg", contentType: "audio/ogg" });
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    if (languageHint) {
      formData.append("language", languageHint);
    }

    const transcription = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    return {
      text: transcription.data.text || "",
      detectedLanguage: (transcription.data.language || "").toLowerCase(),
    };
  } catch (err) {
    console.error("❌ Voice Transcription Error:", err);
    return null;
  }
}

// 2. 🧠 AI Engine: Text / Voice Parser (Outputs in Selected Language with Standardized Categories including Transport)
async function extractTransaction(
  text: string, 
  nativeCurrency: string, 
  language: string, 
  nickname: string
): Promise<ExtractedData | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Brofinai, a smart financial assistant.
User Settings -> Selected Language: "${language}", Call User As: "${nickname}", Currency: "${nativeCurrency}".

INSTRUCTIONS:
- Translate the extracted "item" description string strictly into the user's selected language (${language}).
- CRITICAL CATEGORY RULE: You MUST strictly choose the "category" ONLY from this exact standardized English list. Do NOT translate categories into other languages:
  - Food & Groceries
  - Transport (Bus, Train, Fuel, Taxi)
  - Utilities (Bills, Internet, Phone)
  - Rent/Housing
  - Personal Care (Medical, Saloon, Hygiene)
  - Shopping (Clothes, Gadgets)
  - Entertainment (Movies, Subscriptions, Outings)
  - Education (Books, Courses)
  - Debt/Loans
  - Savings/Investments
  - Gifts & Charity
  - Miscellaneous (Unexpected)
- Identify action: 'log_transaction', 'set_budget', or 'set_starting_balance'.

Return pure JSON:
{
  "action": "log_transaction" | "set_budget" | "set_starting_balance",
  "type": "expense" | "income" | "loan_given" | "loan_taken" | "loan_settled" | null,
  "item": "description string in ${language}",
  "category": "Strictly choose ONE from the allowed English category list above",
  "amount": number,
  "person": "string" | null,
  "currency": "${nativeCurrency}"
}`
        },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content || "{}") as ExtractedData;
  } catch (err) {
    console.error("❌ Text Extraction error:", err);
    return null;
  }
}

// 3. 📸 AI Engine: Vision Receipt Parser (Outputs in Selected Language with Standardized Categories including Transport)
async function extractFromImage(
  mediaUrl: string, 
  contentType: string, 
  twilioSid: string, 
  twilioToken: string, 
  nativeCurrency: string,
  language: string,
  nickname: string
): Promise<ExtractedData | null> {
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
          content: `Extract total amount and merchant from receipt image. Base Currency: ${nativeCurrency}.
Write the "item" merchant name in the user's selected language: ${language}.
CRITICAL CATEGORY RULE: You MUST strictly choose the "category" ONLY from this exact standardized English list. Do NOT translate categories:
  - Food & Groceries
  - Transport (Bus, Train, Fuel, Taxi)
  - Utilities (Bills, Internet, Phone)
  - Rent/Housing
  - Personal Care (Medical, Saloon, Hygiene)
  - Shopping (Clothes, Gadgets)
  - Entertainment (Movies, Subscriptions, Outings)
  - Education (Books, Courses)
  - Debt/Loans
  - Savings/Investments
  - Gifts & Charity
  - Miscellaneous (Unexpected)

Return pure JSON:
{
  "action": "log_transaction",
  "type": "expense",
  "item": "Merchant/Store Name translated in ${language}",
  "category": "Strictly choose ONE from the allowed English category list above",
  "amount": number,
  "person": null,
  "currency": "${nativeCurrency}"
}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Parse receipt details accurately." },
            { type: "image_url", image_url: { url: `data:${contentType};base64,${base64Image}` } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });
    return JSON.parse(openAiResponse.choices[0].message.content || "{}") as ExtractedData;
  } catch (err) {
    console.error("❌ Vision Extraction error:", err);
    return null;
  }
}

// Helper: Save Extracted Transaction/Budget Directly (used for TEXT input — no Confirm/Edit step)
async function saveExtractedDirect(phoneNumber: string, userProfile: any, tx: ExtractedData, userLang: string, nickname: string, currency: string, websiteUrl: string): Promise<string> {
  const formattedAmount = Number(tx.amount).toLocaleString();
  const msgs = await getLocalizedMessages(userLang, nickname, currency, websiteUrl, { item: tx.item, amount: formattedAmount, category: tx.category });

  try {
    // Handle Budget Set
    if (tx.action === "set_budget") {
      const { error: budgetErr } = await supabase
        .from('budgets')
        .insert([{
          phone_number: phoneNumber,
          category: tx.category || 'General',
          amount_limit: tx.amount
        }]);

      if (budgetErr) throw budgetErr;
      return msgs.budgetSaved;
    }

    // Save Transaction to Supabase
    const { error: insErr } = await supabase.from('transactions').insert([{
      phone_number: phoneNumber,
      type: tx.type,
      item: tx.item,
      category: tx.category,
      amount: tx.amount,
      person: tx.person,
      currency: tx.currency || userProfile.currency
    }]);

    if (insErr) throw insErr;

    // Increment Daily Transaction Count
    await supabase.from('users').update({
      daily_tx_count: (userProfile.daily_tx_count || 0) + 1
    }).eq('phone_number', phoneNumber);

    return msgs.savedMsg;
  } catch (err) {
    console.error("❌ Direct Save Error:", err);
    return msgs.dbError;
  }
}

// 4. 💾 DB Handler: Multi-language Confirmation Response
async function handleConfirmTransaction(phoneNumber: string, userProfile: any, userLang: string, nickname: string, currency: string, websiteUrl: string): Promise<string> {
  try {
    const { data: session } = await supabase
      .from('user_sessions')
      .select('pending_transaction')
      .eq('phone_number', phoneNumber)
      .single();

    const emptyMsgs = await getLocalizedMessages(userLang, nickname, currency, websiteUrl);

    if (!session?.pending_transaction) {
      return emptyMsgs.noPending;
    }

    const tx = session.pending_transaction as ExtractedData;
    const formattedAmount = Number(tx.amount).toLocaleString();
    const isIncome = tx.type === 'income';

    const msgs = await getLocalizedMessages(userLang, nickname, currency, websiteUrl, { 
      item: tx.item, 
      amount: formattedAmount, 
      isIncome,
      category: tx.category
    });

    // Handle Budget Set
    if (tx.action === "set_budget") {
      const { error: budgetErr } = await supabase
        .from('budgets')
        .insert([{
          phone_number: phoneNumber,
          category: tx.category || 'General',
          amount_limit: tx.amount
        }]);

      if (budgetErr) throw budgetErr;

      await supabase
        .from('user_sessions')
        .update({ pending_transaction: null, step: 'ACTIVE' })
        .eq('phone_number', phoneNumber);

      return msgs.budgetSaved;
    }

    // Save Transaction to Supabase
    const { error: insErr } = await supabase.from('transactions').insert([{
      phone_number: phoneNumber,
      type: tx.type,
      item: tx.item,
      category: tx.category,
      amount: tx.amount,
      person: tx.person,
      currency: tx.currency || userProfile.currency
    }]);

    if (insErr) throw insErr;

    // Increment User Daily Transaction Count
    await supabase.from('users').update({
      daily_tx_count: (userProfile.daily_tx_count || 0) + 1
    }).eq('phone_number', phoneNumber);

    // Reset Session State
    await supabase
      .from('user_sessions')
      .update({ pending_transaction: null, step: 'ACTIVE' })
      .eq('phone_number', phoneNumber);

    return msgs.savedMsg;

  } catch (err) {
    console.error("❌ DB Insert Error:", err);
    const msgs = await getLocalizedMessages(userLang, nickname, currency, websiteUrl);
    return msgs.dbError;
  }
}

// MAIN WEBHOOK ROUTER
export async function POST(req: NextRequest) {
  try {
    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID!;
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
    
    const formData = await req.formData();
    const rawFrom = formData.get("From") as string; 
    const mediaUrl = formData.get("MediaUrl0") as string | null;
    const mediaContentType = (formData.get("MediaContentType0") as string) || "";
    const body = ((formData.get("Body") as string) || "").trim();

    const from = rawFrom.replace("whatsapp:", "");
    const normalizedBody = body.toLowerCase();

    // 1️⃣ Fetch User Profile
    let { data: userProfile } = await supabase.from('users').select('*').eq('phone_number', from).maybeSingle();

    // UNREGISTERED USER
    if (!userProfile) {
      const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";
      const registerMsg = `👋 Hey there, welcome to Brofinai!\n\nLet's get you set up — please complete your quick registration here:\n👉 ${websiteUrl}/register`;
      
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: registerMsg,
      });
      return new NextResponse("OK", { status: 200 });
    }

    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";
    
    // READ USER'S SELECTED LANGUAGE + CURRENCY FROM DATABASE
    const userLang = userProfile.language || userProfile.preferred_language || "English";
    const nickname = userProfile.how_to_call_you || userProfile.nickname || userProfile.name || "Bro";
    const userCurrency = userProfile.base_currency || userProfile.currency || "LKR";

    // User Plan Identification: 'lite' | 'core' | 'max'
    const userPlan = (userProfile.plan || "lite").toLowerCase();

    // ---------------- DAILY RESET LOGIC ----------------
    await checkAndResetDailyLimits(userProfile);
    // ---------------------------------------------------

    // ---------------- LINK / LOGIN COMMAND CHECK ----------------
    if (["LINK", "LOGIN", "DASHBOARD", "WEBSITE"].includes(body.toUpperCase())) {
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: `🔗 Hey ${nickname}, here's your Brofinai login link:\n👉 ${websiteUrl}/login`,
      });
      return new NextResponse("OK", { status: 200 });
    }
    // -------------------------------------------------------------

    // ---------------- EXCEL / BUDGET COMMAND CHECK ----------------
    if (body.toUpperCase() === "EXCEL" || body.toUpperCase() === "BUDGET") {
      if (userPlan === "lite") {
        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${from}`,
          body: `📊 *Excel Exports & Budget Handling - Locked*\n\n${nickname}, Excel Export එක Instant Download කිරීමයි, Monthly Budget Limits සකසීමයි Broo LITE Plan එකේ ලබාගත නොහැක.\n\n🔓 *Unlock Core Features - $2.55/mo:*\n• One-Click Excel Export\n• Smart Budget Handling\n• 10 Daily Logs + Voice Tracking\n\n🔗 Upgrade Now: https://brofinai/register?plan=core`,
        });
        return new NextResponse("OK", { status: 200 });
      }

      // Logic for Core & Max users to send Excel File...
    }
    // -------------------------------------------------------------

    // 2️⃣ PLAN CHECKS & FEATURE LIMITATIONS
    const isImage = mediaUrl && mediaContentType.startsWith("image/");
    const isAudio = mediaUrl && mediaContentType.startsWith("audio/");

    // Fetch basic localized notices
    const baseMsgs = await getLocalizedMessages(userLang, nickname, userCurrency, websiteUrl);

    // 🛑 1. DAILY TRANSACTION LIMIT CHECK (FOR LITE AND CORE)
    const currentDailyTx = userProfile.daily_tx_count || 0;
    if (!normalizedBody.includes("registered") && normalizedBody !== "confirm" && normalizedBody !== "edit") {
      if (userPlan === "lite" && currentDailyTx >= 3) {
        await twilioClient.messages.create({ from: TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${from}`, body: baseMsgs.dailyTxLimitReached });
        return new NextResponse("OK", { status: 200 });
      }
      if (userPlan === "core" && currentDailyTx >= 10) {
        await twilioClient.messages.create({ from: TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${from}`, body: baseMsgs.dailyTxLimitReached });
        return new NextResponse("OK", { status: 200 });
      }
    }

    // 🛑 2. OCR / IMAGE SCAN LIMIT CHECKS
    if (isImage) {
      const dailyOcr = userProfile.daily_ocr_count || 0;

      if (userPlan === "lite" && dailyOcr >= 1) {
        await twilioClient.messages.create({ from: TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${from}`, body: baseMsgs.dailyOcrLimitReached });
        return new NextResponse("OK", { status: 200 });
      }

      if (userPlan === "core") {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: usage } = await supabase
          .from('monthly_usage')
          .select('scan_count')
          .eq('phone_number', from)
          .eq('month_year', currentMonth)
          .maybeSingle();

        const currentScanCount = usage?.scan_count || 0;

        if (currentScanCount >= 30) {
          await twilioClient.messages.create({ from: TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${from}`, body: baseMsgs.limitReached });
          return new NextResponse("OK", { status: 200 });
        }

        await supabase.from('monthly_usage').upsert({
          phone_number: from,
          month_year: currentMonth,
          scan_count: currentScanCount + 1,
        }, { onConflict: 'phone_number, month_year' });
      }

      // Increment Daily OCR count for user
      await supabase.from('users').update({
        daily_ocr_count: dailyOcr + 1
      }).eq('phone_number', from);
    }

    // 🛑 3. VOICE NOTE LIMIT CHECKS
    if (isAudio) {
      if (userPlan === "lite") {
        await twilioClient.messages.create({ from: TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${from}`, body: baseMsgs.proFeatureVoice });
        return new NextResponse("OK", { status: 200 });
      }

      if (userPlan === "core") {
        const dailyVoice = userProfile.daily_voice_count || 0;
        if (dailyVoice >= 5) {
          await twilioClient.messages.create({ from: TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${from}`, body: baseMsgs.dailyVoiceLimitReached });
          return new NextResponse("OK", { status: 200 });
        }
        await supabase.from('users').update({
          daily_voice_count: dailyVoice + 1
        }).eq('phone_number', from);
      }
    }

    // 3️⃣ SESSION VERIFICATION & FETCHING
    let { data: sessionState } = await supabase.from('user_sessions').select('*').eq('phone_number', from).maybeSingle();

    if (!sessionState) {
      const { data: newSession } = await supabase
        .from('user_sessions')
        .insert({ phone_number: from, step: 'AWAITING_STARTING_BALANCE' })
        .select()
        .single();
      sessionState = newSession;
    }

    // 4️⃣ FIRST-TIME REGISTRATION REDIRECT MESSAGE
    if (normalizedBody.includes("registered") || normalizedBody.includes("hi broo")) {
      await supabase.from('user_sessions').update({ step: 'AWAITING_STARTING_BALANCE' }).eq('phone_number', from);
      
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: baseMsgs.welcome,
      });
      return new NextResponse("OK", { status: 200 });
    }

    // 5️⃣ STEP: AWAITING STARTING BALANCE
    if (sessionState?.step === 'AWAITING_STARTING_BALANCE') {
      const extracted = await extractTransaction(body, userCurrency, userLang, nickname);

      if (extracted && extracted.amount) {
        await supabase.from('transactions').insert([{
          phone_number: from,
          type: 'income',
          item: 'Starting Capital',
          category: 'Savings/Investments',
          amount: extracted.amount,
          currency: userCurrency
        }]);

        await supabase.from('user_sessions').update({ step: 'ACTIVE' }).eq('phone_number', from);

        const formattedAmountStr = Number(extracted.amount).toLocaleString();
        const guideMsgs = await getLocalizedMessages(userLang, nickname, userCurrency, websiteUrl, { amount: formattedAmountStr });

        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${from}`,
          body: guideMsgs.guidelines,
        });
        return new NextResponse("OK", { status: 200 });
      }
    }

    // 6️⃣ CONFIRM / EDIT HANDLERS (Flexible multi-language confirmation)
    if (normalizedBody === "confirm" || normalizedBody === "potwierdź" || normalizedBody === "yes" || normalizedBody === "confirmar") {
      const respMessage = await handleConfirmTransaction(from, userProfile, userLang, nickname, userCurrency, websiteUrl);
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: respMessage,
      });
      return new NextResponse("OK", { status: 200 });
    }

    if (normalizedBody === "edit" || normalizedBody === "edytuj" || normalizedBody === "editar") {
      await supabase.from('user_sessions').update({ pending_transaction: null }).eq('phone_number', from);
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: baseMsgs.editCancel,
      });
      return new NextResponse("OK", { status: 200 });
    }

    // 7️⃣ EXTRACTION ENGINE (IMAGE / VOICE / TEXT)
    let extractedTx: ExtractedData | null = null;

    if (mediaUrl) {
      if (isImage) {
        extractedTx = await extractFromImage(mediaUrl, mediaContentType, TWILIO_SID, TWILIO_TOKEN, userCurrency, userLang, nickname);
      } else if (isAudio) {
        const langInfo = getWhisperLanguageInfo(userLang);
        const transcriptionResult = await transcribeVoice(mediaUrl, TWILIO_SID, TWILIO_TOKEN, langInfo?.isoCode || null);

        if (!transcriptionResult || !transcriptionResult.text) {
          await twilioClient.messages.create({ from: TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${from}`, body: baseMsgs.fallback });
          return new NextResponse("OK", { status: 200 });
        }

        // Validate detected language matches the user's registered language.
        // Skipped for "Singlish" (langInfo is null) since it's code-switched mixed speech.
        if (langInfo && transcriptionResult.detectedLanguage && transcriptionResult.detectedLanguage !== langInfo.name) {
          const mismatchMsgs = await getLocalizedMessages(userLang, nickname, userCurrency, websiteUrl, { language: langInfo.name });
          await twilioClient.messages.create({ from: TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${from}`, body: mismatchMsgs.voiceLangMismatch });
          return new NextResponse("OK", { status: 200 });
        }

        extractedTx = await extractTransaction(transcriptionResult.text, userCurrency, userLang, nickname);
      }
    } else if (body) {
      extractedTx = await extractTransaction(body, userCurrency, userLang, nickname);
    }

    // 8️⃣ TEXT -> SAVE DIRECTLY | VOICE / IMAGE -> SEND PREVIEW FOR CONFIRM/EDIT
    if (extractedTx && extractedTx.amount) {
      if (!mediaUrl) {
        // TEXT input: correct/certain enough — save straight to the database, no Confirm/Edit step
        const directMsg = await saveExtractedDirect(from, userProfile, extractedTx, userLang, nickname, userCurrency, websiteUrl);
        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${from}`,
          body: directMsg,
        });
        return new NextResponse("OK", { status: 200 });
      }

      // VOICE / IMAGE input: always show a preview and require Confirm/Edit (applies to every plan, including Max)
      await supabase.from('user_sessions').update({ pending_transaction: extractedTx }).eq('phone_number', from);
      
      const formattedNumber = Number(extractedTx.amount).toLocaleString();
      const typeTag = extractedTx.action === 'set_budget' ? '🎯 Budget' : (extractedTx.type === 'income' ? baseMsgs.typeIncome : baseMsgs.typeExpense);
      
      const previewMsgs = await getLocalizedMessages(userLang, nickname, userCurrency, websiteUrl, {
        item: extractedTx.action === 'set_budget' ? 'Monthly Budget' : extractedTx.item,
        typeTag,
        category: extractedTx.category,
        amount: formattedNumber
      });
      
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: previewMsgs.preview,
      });
    } else {
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: baseMsgs.fallback,
      });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Fatal Webhook Error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}