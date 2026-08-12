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
  contextData: { amount?: string; item?: string; isIncome?: boolean; typeTag?: string; category?: string } = {}
): Promise<LocalizedMessages> {
  const targetLang = (lang || "English").trim();
  const key = targetLang.toLowerCase();

  // Base English Template with Placeholders
  const ENGLISH_TEMPLATE: LocalizedMessages = {
    welcome: `👋 Welcome {NICKNAME}!\n\nI am your Personal Finance Assistant *Broo.ai*! 🚀\n\nTo start, what is your current **Starting Balance / Capital** in your account?\n\n💡 Example: *"50000"* or *"25000"*`,
    guidelines: `🎯 Awesome {NICKNAME}! Your **Starting Balance** is set to *{CURRENCY} {AMOUNT}*! 🎉\n\n--- 💡 *Broo.ai Quick Guide* ---\n\n💸 *Log Expense:*\n| "Spent 500 for lunch" / "Bus fare 80"\n\n💰 *Add Income:*\n| "Got salary 150000" / "Got bonus 10000"\n\n🎯 *Set Monthly Budget:*\n| "Set budget 50000"\n\n🚀 *Send your first Expense or Income now!*`,
    proFeatureImage: `🔒 *AI Receipt Scanning Limit Reached / Pro Feature!*\n\n{NICKNAME}, upgrade to Broo Core or Max for more scans:\n👉 {WEBSITE}/#pricing`,
    proFeatureVoice: `🔒 *Voice Notes is a Pro Feature!*\n\n{NICKNAME}, upgrade to Broo Core or Max:\n👉 {WEBSITE}/#pricing`,
    limitReached: `⚠️ *Monthly Receipt Limit Reached (30/30 Scans)*\n\n{NICKNAME}, upgrade to BROO MAX:\n👉 {WEBSITE}/#pricing`,
    noPending: `⚠️ Hi {NICKNAME}, there is no pending transaction to confirm!`,
    budgetSaved: `🎯 Awesome {NICKNAME}! Your monthly budget is set to *{CURRENCY} {AMOUNT}*! 🚀`,
    savedMsg: `Awesome {NICKNAME}! Saved *{CURRENCY} {AMOUNT}* for *{ITEM}*! 🚀`,
    autoSavedMsg: `⚡ *Auto Saved!*\n\nAwesome {NICKNAME}! Saved *{CURRENCY} {AMOUNT}* for *{ITEM}*! 🚀`,
    dbError: `🚨 An error occurred while saving to database.`,
    directError: `🚨 An error occurred during direct save.`,
    editCancel: `No problem {NICKNAME}! Send the corrected details.`,
    fallback: `Sorry {NICKNAME}, I couldn't understand that. Try sending "Spent 500 for lunch"! 🚀`,
    preview: `📝 Description: *{ITEM}*\n🏷️ Type: *{TYPETAG}*\n🗂️ Category: *{CATEGORY}*\n💰 Amount: *{CURRENCY} {AMOUNT}*\n\n-> Reply *Confirm* to save.\n-> Reply *Edit* to change.`,
    typeIncome: `🟢 Income`,
    typeExpense: `🔴 Expense`,
    // NEW LIMIT MESSAGES (ENGLISH)
    dailyTxLimitReached: `⚠️ *Daily Transaction Limit Reached!*\n\n{NICKNAME}, your plan daily transaction limit is reached.\n\n🚀 Upgrade to Broo Core or Max for unlimited tracking:\n👉 {WEBSITE}/#pricing`,
    dailyOcrLimitReached: `⚠️ *Daily Receipt Scan Limit Reached (1/1 Scan)*\n\n{NICKNAME}, upgrade to BROO CORE (30 scans/mo) or BROO MAX (Unlimited):\n👉 {WEBSITE}/#pricing`,
    dailyVoiceLimitReached: `⚠️ *Daily Voice Limit Reached (5/5 Notes)*\n\n{NICKNAME}, upgrade to BROO MAX for unlimited voice tracking:\n👉 {WEBSITE}/#pricing`,
  };

  // 1. SINGLISH FORMATTED TEMPLATE
  if (key === "singlish") {
    const SINGLISH_TEMPLATE: LocalizedMessages = {
      welcome: `👋 සාදරයෙන් පිළිගන්නවා {NICKNAME}!\n\nමම ඔයාගේ Personal Finance Assistant *Broo.ai*! 🚀\n\nවැඩේ ලස්සනට පටන් ගන්න, **දැනට ඔයා ගාව/Bank Account එකේ තියෙන ආරම්භක මුදල (Starting Capital)** කීයද කියන්න?\n\n💡 උදාහරණ: *"50000"* හෝ *"25000"*`,
      guidelines: `🎯 නියමයි {NICKNAME}! ඔයාගේ Starting Balance එක *{CURRENCY} {AMOUNT}* විදිහට Set කරගත්තා! 🎉\n\n--- 💡 *Broo.ai Quick Guide* ---\n\n💸 *Expense එකක් දාන්න:*\n| "Spent 500 for lunch" / "Bus fare 80"\n\n💰 *Income එකක් එකතු කරන්න:*\n| "Salary labuna 150000" / "Got bonus 10000"\n\n🎯 *Monthly Budget එකක් set කරන්න:*\n| "Set budget 50000"\n\n🚀 *දැන් ඔයාගේ පළවෙනි Expense එක හරි Income එක හරි එවලා බලන්න!*`,
      proFeatureImage: `🔒 *AI Receipt Scanning is a Pro Feature!*\n\n{NICKNAME}, **BROO LITE** plan එකෙන් දවසට Scan 1යි. Upgrade වෙන්න:\n👉 {WEBSITE}/#pricing`,
      proFeatureVoice: `🔒 *Voice Notes is a Pro Feature!*\n\n{NICKNAME}, Voice Notes පහසුකම Broo Lite එකේ නෑ. Pro Plan එකකට Upgrade වෙන්න:\n👉 {WEBSITE}/#pricing`,
      limitReached: `⚠️ *Monthly Receipt Limit Reached (30/30 Scans)*\n\n{NICKNAME}, මේ මාසෙ Scans 30ම ඉවරයි. Unlimited Scans සඳහා **BROO MAX** වලට Upgrade වෙන්න!\n👉 {WEBSITE}/#pricing`,
      noPending: `⚠️ Hi {NICKNAME}, confirm කරන්න කිසිම pending transaction එකක් නෑනේ!`,
      budgetSaved: `🎯 එළකිරි {NICKNAME}! ඔයාගේ මේ මාසෙ Budget එක *{CURRENCY} {AMOUNT}* විදිහට සේව් කරගත්තා! 🚀`,
      savedMsg: `එළකිරි {NICKNAME}! *{ITEM}* එකට සේව් කරගත්තා *{CURRENCY} {AMOUNT}*! 🚀`,
      autoSavedMsg: `⚡ *Auto Saved!* (Broo Max feature)\n\nඑළකිරි {NICKNAME}! *{ITEM}* එකට ගිය *{CURRENCY} {AMOUNT}* සේව් කරගත්තා! 🚀`,
      dbError: `🚨 Database එකට Save වෙද්දී අවුලක් වුණා මචං. ආයේ Try එකක් දෙමුද?`,
      directError: `🚨 Direct save වෙද්දී අවුලක් වුණා මචං.`,
      editCancel: `අවුලක් නෑ {NICKNAME}! නිවැරදි විස්තරේ ආයේ එවපන්.`,
      fallback: `Sorry {NICKNAME}, මට ඒක පැහැදිලි වුණේ නෑ බං. "Spent 500 for lunch" වගේ text එකක් එවන්න! 🚀`,
      preview: `📝 විස්තරය: *{ITEM}*\n🏷️ වර්ගය: *{TYPETAG}*\n🗂️ කාණ්ඩය: *{CATEGORY}*\n💰 ගාණ: *{CURRENCY} {AMOUNT}*\n\n-> හරිනම් *Confirm* කියලා reply කරපන්.\n-> වැරදියි නම් *Edit* කියලා reply කරපන්.`,
      typeIncome: `🟢 ආදායම`,
      typeExpense: `🔴 වියදම`,
      // NEW LIMIT MESSAGES (SINGLISH)
      dailyTxLimitReached: `⚠️ *Daily Transaction Limit Reached!*\n\n{NICKNAME}, ඔයාගේ Plan එකේ අද දවසේ Limit එක ඉවරයි.\n\n🚀 Unlimited tracking සඳහා Upgrade වෙන්න:\n👉 {WEBSITE}/#pricing`,
      dailyOcrLimitReached: `⚠️ *Daily Receipt Scan Limit Reached (1/1 Scan)*\n\n{NICKNAME}, Broo Lite එකේ දවසට Scans 1යි. Unlimited සඳහා **BROO CORE / MAX** වලට Upgrade වෙන්න!\n👉 {WEBSITE}/#pricing`,
      dailyVoiceLimitReached: `⚠️ *Daily Voice Limit Reached (5/5 Notes)*\n\n{NICKNAME}, Broo Core හි දවසට Voice 5 සීමාව අවසන්. Unlimited සඳහා **BROO MAX** ලබාගන්න!\n👉 {WEBSITE}/#pricing`,
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
      const prompt = `You are translating WhatsApp UI message templates for "Broo.ai" (a personal finance bot) into "${targetLang}".

Rules:
- Translate ONLY human-readable sentences into ${targetLang}.
- CRITICAL: KEEP THE WORDS "Confirm" AND "Edit" IN ENGLISH IN THE PREVIEW INSTRUCTION (e.g., "Reply Confirm to save / Reply Edit to change"). DO NOT TRANSLATE "Confirm" AND "Edit" COMMAND WORDS!
- NEVER translate or remove tokens inside curly braces: {NICKNAME}, {CURRENCY}, {AMOUNT}, {ITEM}, {WEBSITE}, {TYPETAG}, {CATEGORY}.
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
  contextData: { amount?: string; item?: string; isIncome?: boolean; typeTag?: string; category?: string }
): LocalizedMessages {
  const replacements: [string, string][] = [
    ["{NICKNAME}", nickname],
    ["{CURRENCY}", currency],
    ["{AMOUNT}", contextData.amount || "0"],
    ["{ITEM}", contextData.item || ""],
    ["{WEBSITE}", websiteUrl],
    ["{TYPETAG}", contextData.typeTag || ""],
    ["{CATEGORY}", contextData.category || ""],
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
  };
}

// 1. 🎤 Voice to Text Transcriber
async function transcribeVoice(mediaUrl: string, twilioSid: string, twilioToken: string): Promise<string | null> {
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

    const transcription = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    return transcription.data.text || null;
  } catch (err) {
    console.error("❌ Voice Transcription Error:", err);
    return null;
  }
}

// 2. 🧠 AI Engine: Text / Voice Parser (Outputs in Selected Language)
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
          content: `You are Broo.ai, a smart financial assistant.
User Settings -> Selected Language: "${language}", Call User As: "${nickname}", Currency: "${nativeCurrency}".

INSTRUCTIONS:
- Translate the extracted "item" description string strictly into the user's selected language (${language}).
- Translate the "category" name strictly into the user's selected language (${language}).
- Identify action: 'log_transaction', 'set_budget', or 'set_starting_balance'.

Categories: [Food, Transport, Bills, Shopping, Entertainment, Medical, Education, Salary, Starting Balance, Loan, Budget, Other].

Return pure JSON:
{
  "action": "log_transaction" | "set_budget" | "set_starting_balance",
  "type": "expense" | "income" | "loan_given" | "loan_taken" | "loan_settled" | null,
  "item": "description string in ${language}",
  "category": "category string in ${language}",
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

// 3. 📸 AI Engine: Vision Receipt Parser (Outputs in Selected Language)
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
Write the "item" merchant name and "category" in the user's selected language: ${language}.

Return pure JSON:
{
  "action": "log_transaction",
  "type": "expense",
  "item": "Merchant/Store Name translated in ${language}",
  "category": "Category Name translated in ${language}",
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

// Helper: Save Direct Transaction
async function saveTransactionDirect(phoneNumber: string, userProfile: any, tx: ExtractedData, userLang: string, nickname: string, currency: string, websiteUrl: string): Promise<string> {
  const { error } = await supabase.from('transactions').insert([{
    phone_number: phoneNumber,
    type: tx.type,
    item: tx.item,
    category: tx.category,
    amount: tx.amount,
    person: tx.person,
    currency: tx.currency || userProfile.currency
  }]);

  const formattedAmount = Number(tx.amount).toLocaleString();
  const msgs = await getLocalizedMessages(userLang, nickname, currency, websiteUrl, { item: tx.item, amount: formattedAmount });

  if (error) {
    console.error("❌ Auto Save Error:", error);
    return msgs.directError;
  }

  // Increment Transaction Count
  await supabase.from('users').update({
    daily_tx_count: (userProfile.daily_tx_count || 0) + 1
  }).eq('phone_number', phoneNumber);

  return msgs.autoSavedMsg;
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
      isIncome 
    });

    // Handle Budget Set (මෙතැනදී Confirm කළ පසු පමණක් ඩේටාබේස් එකට save වේ)[cite: 5]
    if (tx.action === "set_budget") {
      await supabase
        .from('users')
        .update({ monthly_budget: tx.amount })
        .eq('phone_number', phoneNumber);

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
      const registerMsg = `👋 Welcome to Broo.ai!\n\nPlease complete your registration first:\n👉 ${websiteUrl}/register`;
      
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

    // ---------------- EXCEL / BUDGET COMMAND CHECK ----------------
    if (body.toUpperCase() === "EXCEL" || body.toUpperCase() === "BUDGET") {
      if (userPlan === "lite") {
        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${from}`,
          body: `📊 *Excel Exports & Budget Handling are Locked!*\n\nExcel spreadsheets instant download කිරීම සහ Monthly Budget Limits set කිරීම Broo LITE හි ලබාගත නොහැක.\n\n🔓 *Unlock Core Features for $2.55/mo:*\n• One-click Excel Export\n• Smart Budget Handling\n• 10 Daily Logs + Voice Tracking\n\n🔗 Unlock Features: https://broo.ai/register?plan=core`,
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
          category: 'Starting Balance',
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
        const transcribedText = await transcribeVoice(mediaUrl, TWILIO_SID, TWILIO_TOKEN);
        if (transcribedText) {
          extractedTx = await extractTransaction(transcribedText, userCurrency, userLang, nickname);
        }
      }
    } else if (body) {
      extractedTx = await extractTransaction(body, userCurrency, userLang, nickname);
    }

    // 8️⃣ SEND PREVIEW OR AUTO-SAVE
    if (extractedTx && extractedTx.amount) {
      if (userPlan === "max" && isImage) {
        const autoSaveMsg = await saveTransactionDirect(from, userProfile, extractedTx, userLang, nickname, userCurrency, websiteUrl);
        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${from}`,
          body: autoSaveMsg,
        });
        return new NextResponse("OK", { status: 200 });
      }

      // බජට් එකක් වුණත් දැන් pending_transaction ලෙස save වී ප්‍රිව്യൂ පෙන්වනු ලැබේ[cite: 5]
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