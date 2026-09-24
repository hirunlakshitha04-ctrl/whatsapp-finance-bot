import { OpenAI } from "openai";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// =====================================================================
// SHARED FINANCE LOGIC
// Used by BOTH app/api/whatsapp/route.ts AND app/api/telegram/route.ts.
// Nothing in this file is channel-specific — no Twilio, no Telegram API
// calls live here. Each route downloads its own media (Twilio auth vs
// Telegram getFile) and hands this file a plain Buffer/base64 string.
//
// Any function that touches a specific user row (transactions, users,
// user_sessions, budgets) takes `idColumn` + `idValue` so the SAME
// function works for WhatsApp (`phone_number`) and Telegram
// (`telegram_chat_id`) — no duplicated DB logic between channels.
// =====================================================================

export type UserIdColumn = "phone_number" | "telegram_chat_id";

// ---------------------- Types ----------------------
export interface ExtractedData {
  action:
    | "log_transaction"
    | "set_budget"
    | "set_starting_balance"
    | "create_recurring_expense"
    | "create_savings_goal"
    | "add_savings_contribution"
    | "create_debt"
    | "repay_debt"
    | "collect_debt";
  type: "expense" | "income" | null;
  item: string;
  category: string;
  amount: number;
  currency: string;
  confirmation_message?: string;
  frequency?: "daily" | "weekly" | "monthly" | null;
  next_due_date?: string | null;
  day_of_month?: number | null;
  day_of_week?: number | null;
  goal_name?: string | null;
  target_amount?: number | null;
  target_date?: string | null;
  person_name?: string | null;
  debt_direction?: "owed_by_user" | "owed_to_user" | null;
}

export interface LocalizedMessages {
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
  dailyTxLimitReached: string;
  dailyOcrLimitReached: string;
  dailyVoiceLimitReached: string;
  voiceLangMismatch: string;
  featurePreview: string;
  featureEdit: string;
  missingRecurringFrequency: string;
  debtNotFound: string;
  debtOverpayment: string;
  savedFeature: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// In-memory Translation Cache
const translationCache = new Map<string, LocalizedMessages>();

// =====================================================================
// 🌍 MULTI-LANGUAGE SYSTEM MESSAGES (channel-agnostic)
// =====================================================================
export async function getLocalizedMessages(
  lang: string,
  nickname: string,
  currency: string,
  websiteUrl: string='https://brofinai.com', // මෙන්න මෙහෙම දාන්න
  contextData: { amount?: string; item?: string; isIncome?: boolean; typeTag?: string; category?: string; language?: string; details?: string } = {}
): Promise<LocalizedMessages> {
  const targetLang = (lang || "English").trim();
  const key = targetLang.toLowerCase();

  const ENGLISH_TEMPLATE: LocalizedMessages = {
    welcome: `👋 Welcome, {NICKNAME}!\n\nI'm *Brofinai*, your Personal Finance Assistant — here to help you track and manage your money with ease. 🚀\n\nTo get started, please share your current **Starting Balance / Capital**.\n\n💡 Example: *"50000"* or *"25000"*`,
    guidelines: `🎯 Great, {NICKNAME}! Your **Starting Balance** has been set to *{CURRENCY} {AMOUNT}*. 🎉\n\n--- 💡 *Brofinai Quick Guide* ---\n\n💸 *Log an Expense:*\n| "Spent 500 for lunch" / "Bus fare 80"\n\n💰 *Log an Income:*\n| "Got salary 150000" / "Got bonus 10000"\n\n🎯 *Set a Monthly Budget:*\n| "Set budget 50000"\n\n🚀 You're all set — send your first expense or income to begin tracking!`,
    proFeatureImage: `🔒 *Pro Feature: AI Receipt Scanning*\n\nHey {NICKNAME}, you've hit your scan limit for now. Upgrade to Broo Core or Max to unlock more scans:\n👉 {WEBSITE}/#pricing`,
    proFeatureVoice: `🔒 *Pro Feature: Voice Notes*\n\nHey {NICKNAME}, voice tracking is available on Broo Core or Max. Upgrade to unlock it:\n👉 {WEBSITE}/#pricing`,
    limitReached: `⚠️ *Monthly Receipt Limit Reached (30/30 Scans)*\n\nHey {NICKNAME}, you've used up all your scans for this month. Upgrade to BROO MAX for unlimited scanning:\n👉 {WEBSITE}/#pricing`,
    noPending: `⚠️ Hey {NICKNAME}, there's no pending transaction to confirm right now!`,
    budgetSaved: `🎯 Nice one, {NICKNAME}! Your *{CATEGORY}* budget is now set to *{CURRENCY} {AMOUNT}*. 🎉`,
    savedMsg: `✅ *Saved!*\n\n📝 Description: *{ITEM}*\n🏷️ Type: *{TYPETAG}*\n🗂️ Category: *{CATEGORY}*\n💰 Amount: *{CURRENCY} {AMOUNT}*`,
    autoSavedMsg: `⚡ *Auto-Saved!*\n\nNice, {NICKNAME}! I've saved *{CURRENCY} {AMOUNT}* for *{ITEM}*. 🚀`,
    dbError: `🚨 Oops, something went wrong while saving that. Please try again in a moment.`,
    directError: `🚨 Something went wrong during the auto-save. Please try again.`,
    editCancel: `No worries, {NICKNAME}! Go ahead and send the corrected details.`,
    fallback: `Hmm, I couldn't quite catch that, {NICKNAME}. Try something like "Spent 500 for lunch"! 🚀`,
    preview: `📝 Description: *{ITEM}*\n🏷️ Type: *{TYPETAG}*\n🗂️ Category: *{CATEGORY}*\n💰 Amount: *{CURRENCY} {AMOUNT}*\n\n-> Reply *Confirm* to save.\n-> Reply *Edit* to make changes.`,
    typeIncome: `🟢 Income`,
    typeExpense: `🔴 Expense`,
    dailyTxLimitReached: `⚠️ *Daily Transaction Limit Reached!*\n\nHey {NICKNAME}, you've hit your plan's daily transaction limit.\n\n🚀 Upgrade to Broo Core or Max for unlimited tracking:\n👉 {WEBSITE}/#pricing`,
    dailyOcrLimitReached: `⚠️ *Daily Receipt Scan Limit Reached (1/1 Scan)*\n\nHey {NICKNAME}, upgrade to BROO CORE (30 scans/mo) or BROO MAX (unlimited) for more scanning power:\n👉 {WEBSITE}/#pricing`,
    dailyVoiceLimitReached: `⚠️ *Daily Voice Limit Reached (5/5 Notes)*\n\nHey {NICKNAME}, upgrade to BROO MAX for unlimited voice tracking:\n👉 {WEBSITE}/#pricing`,
    voiceLangMismatch: `🎤 *Language Not Recognized*\n\nHey {NICKNAME}, I couldn't clearly understand that voice note. Please speak in *{LANGUAGE}* or *English* so I can process it accurately. 🙏`,
    featurePreview: `🔎 *Please confirm this*\n\n{DETAILS}\n\nReply *Confirm* to save it.\nReply *Edit* and send the corrected details.`,
    featureEdit: `✏️ No problem, {NICKNAME}. Send the corrected details and I'll check them again before saving.`,
    missingRecurringFrequency: `🔁 I found a recurring payment, but I need the frequency first.\n\nPlease say *daily*, *weekly*, or *monthly*.\nExample: *Rent 50000 every month*`,
    debtNotFound: `⚠️ I couldn't find an open debt for *{PERSON}*. Please send the person's name and amount again, or reply *Edit*.`,
    debtOverpayment: `⚠️ The repayment amount is greater than the remaining debt for *{PERSON}*. Please send the correct amount, or reply *Edit*.`,
    savedFeature: `✅ *Saved!*\n\n{DETAILS}`,
  };

  if (key === "singlish") {
    const SINGLISH_TEMPLATE: LocalizedMessages = {
      welcome: `👋 සාදරයෙන් පිළිගන්නවා, {NICKNAME}!\n\nමම ඔබේ Personal Finance Assistant *Brofinai*. ඔබේ මුදල් කළමනාකරණය පහසු කර දීමට මම මෙතන ඉන්නවා. 🚀\n\nපටන් ගැනීමට, ඔබේ ගිණුමේ දැනට ඇති **ආරම්භක මුදල (Starting Balance / Capital)** කීයද කියලා සඳහන් කරන්න.\n\n💡 උදාහරණ: *"50000"* හෝ *"25000"*`,
      guidelines: `🎯 සුභ පැතුම්, {NICKNAME}! ඔබේ Starting Balance එක *{CURRENCY} {AMOUNT}* ලෙස සකසා ඇත. 🎉\n\n--- 💡 *Brofinai Quick Guide* ---\n\n💸 *Expense එකක් Log කරන්න:*\n| "Spent 500 for lunch" / "Bus fare 80"\n\n💰 *Income එකක් Log කරන්න:*\n| "Got salary 150000" / "Got bonus 10000"\n\n🎯 *Monthly Budget එකක් Set කරන්න:*\n| "Set budget 50000"\n\n🚀 ඔබේ පළමු Expense එක හෝ Income එක එවා Tracking ආරම්භ කරන්න!`,
      proFeatureImage: `🔒 *AI Receipt Scanning - Pro Feature*\n\n{NICKNAME}, ඔබේ Scan Limit එක අවසන් වෙලා. තව Scans ලබාගන්න Broo Core හෝ Max plan එකකට Upgrade වෙන්න:\n👉 {WEBSITE}/#pricing`,
      proFeatureVoice: `🔒 *Voice Notes - Pro Feature*\n\n{NICKNAME}, Voice Tracking පහසුකම තියෙන්නෙ Broo Core සහ Max Plan වල විතරයි. Upgrade වෙලා try කරන්න:\n👉 {WEBSITE}/#pricing`,
      limitReached: `⚠️ *Monthly Receipt Limit Reached (30/30 Scans)*\n\n{NICKNAME}, මේ මාසෙට ඔබේ Scans ඔක්කොම භාවිත වෙලා ඉවරයි. Unlimited Scans සඳහා **BROO MAX** එකට Upgrade වෙන්න:\n👉 {WEBSITE}/#pricing`,
      noPending: `⚠️ {NICKNAME}, දැනට Confirm කරන්න පොරොත්තු Transaction එකක් නෑ!`,
      budgetSaved: `🎯 සුභ පැතුම්, {NICKNAME}! ඔබේ *{CATEGORY}* Budget එක *{CURRENCY} {AMOUNT}* ලෙස සකසා ඇත. 🎉`,
      savedMsg: `✅ *Save උනා!*\n\n📝 විස්තරය: *{ITEM}*\n🏷️ වර්ගය: *{TYPETAG}*\n🗂️ කාණ්ඩය: *{CATEGORY}*\n💰 ගාණ: *{CURRENCY} {AMOUNT}*`,
      autoSavedMsg: `⚡ *Auto Saved!* (Broo Max Feature)\n\nහරි, {NICKNAME}! *{ITEM}* සඳහා *{CURRENCY} {AMOUNT}* Save කරගත්තා. 🚀`,
      dbError: `🚨 Database එකට Save කරද්දී අවුලක් සිදුවුණා, {NICKNAME}. කරුණාකර ටිකකින් ආයෙත් Try කරන්න.`,
      directError: `🚨 Auto-Save කරද්දී අවුලක් සිදුවුණා. කරුණාකර ආයෙත් Try කරන්න.`,
      editCancel: `කමක් නෑ, {NICKNAME}! නිවැරදි විස්තර ආයෙත් එවන්න.`,
      fallback: `Sorry, {NICKNAME}, ඒක මට හරියටම තේරුණේ නෑ. "Spent 500 for lunch" වගේ එකක් Try කරන්න! 🚀`,
      preview: `📝 විස්තරය: *{ITEM}*\n🏷️ වර්ගය: *{TYPETAG}*\n🗂️ කාණ්ඩය: *{CATEGORY}*\n💰 ගාණ: *{CURRENCY} {AMOUNT}*\n\n-> Save කරන්න *Confirm* කියලා Reply කරන්න.\n-> වෙනස් කරන්න *Edit* කියලා Reply කරන්න.`,
      typeIncome: `🟢 ආදායම`,
      typeExpense: `🔴 වියදම`,
      dailyTxLimitReached: `⚠️ *Daily Transaction Limit Reached!*\n\n{NICKNAME}, ඔබේ Plan එකේ අද දවසේ Transaction Limit එක අවසන් වෙලා.\n\n🚀 Unlimited Tracking සඳහා Upgrade වෙන්න:\n👉 {WEBSITE}/#pricing`,
      dailyOcrLimitReached: `⚠️ *Daily Receipt Scan Limit Reached (1/1 Scan)*\n\n{NICKNAME}, තව Scans ලබාගැනීමට **BROO CORE** (මාසෙට 30) හෝ **BROO MAX** (Unlimited) එකට Upgrade වෙන්න:\n👉 {WEBSITE}/#pricing`,
      dailyVoiceLimitReached: `⚠️ *Daily Voice Limit Reached (5/5 Notes)*\n\n{NICKNAME}, Unlimited Voice Tracking සඳහා **BROO MAX** එකට Upgrade වෙන්න:\n👉 {WEBSITE}/#pricing`,
      voiceLangMismatch: `🎤 *Language Not Recognized*\n\n{NICKNAME}, ඔබේ Voice Note එක මට හරියටම තේරෙන්නෙ නෑ. කරුණාකර *{LANGUAGE}* හෝ *English* භාෂාවෙන් Clear ලෙස කතා කරන්න. 🙏`,
      featurePreview: `🔎 *මේක Save කරන්න කලින් Confirm කරන්න*\n\n{DETAILS}\n\nSave කරන්න *Confirm* කියලා Reply කරන්න.\nවෙනස් කරන්න *Edit* කියලා Reply කරලා නිවැරදි විස්තර එවන්න.`,
      featureEdit: `✏️ හරි {NICKNAME}. Correct details ටික ආයෙත් එවන්න. Save කරන්න කලින් මම ඒක ආයෙත් check කරන්නම්.`,
      missingRecurringFrequency: `🔁 Recurring payment එක හඳුනාගත්තා, හැබැයි frequency එක ඕන.\n\n*daily*, *weekly*, හෝ *monthly* කියලා කියන්න.\nඋදාහරණ: *Rent 50000 every month*`,
      debtNotFound: `⚠️ *{PERSON}* ගේ open debt එකක් හොයාගන්න බැරි වුණා. Personගේ නම සහ amount එක ආයෙත් එවන්න, නැත්නම් *Edit* කරන්න.`,
      debtOverpayment: `⚠️ *{PERSON}* ට තියෙන remaining debt එකට වඩා repayment amount එක වැඩියි. Correct amount එක එවන්න, නැත්නම් *Edit* කරන්න.`,
      savedFeature: `✅ *Save උනා!*\n\n{DETAILS}`,
    };
    return fillTemplate(SINGLISH_TEMPLATE, nickname, currency, websiteUrl, contextData);
  }

  if (key === "english") {
    return fillTemplate(ENGLISH_TEMPLATE, nickname, currency, websiteUrl, contextData);
  }

  let rawTemplate: LocalizedMessages;
  if (translationCache.has(key)) {
    rawTemplate = translationCache.get(key)!;
  } else {
    try {
      const prompt = `You are translating WhatsApp UI message templates for "Brofinai" (a personal finance bot) into "${targetLang}".

Rules:
- Translate ONLY human-readable sentences into ${targetLang}.
- CRITICAL: KEEP THE WORDS "Confirm" AND "Edit" IN ENGLISH IN THE PREVIEW INSTRUCTION (e.g., "Reply Confirm to save / Reply Edit to change"). DO NOT TRANSLATE "Confirm" AND "Edit" COMMAND WORDS!
- NEVER translate or remove tokens inside curly braces: {NICKNAME}, {CURRENCY}, {AMOUNT}, {ITEM}, {WEBSITE}, {TYPETAG}, {CATEGORY}, {LANGUAGE}, {DETAILS}.
- Keep all formatting intact: *, _, |, ---, \\n, and emojis.
- Translate "typeIncome" and "typeExpense" (keep emoji prefix).
- Return pure JSON matching the template keys.

Source JSON:
${JSON.stringify(ENGLISH_TEMPLATE, null, 2)}`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
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

function fillTemplate(
  template: LocalizedMessages,
  nickname: string,
  currency: string,
  websiteUrl: string,
  contextData: { amount?: string; item?: string; isIncome?: boolean; typeTag?: string; category?: string; language?: string; details?: string }
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
    ["{DETAILS}", contextData.details || ""],
  ];

  const fill = (str: string) => replacements.reduce((acc, [token, value]) => acc.split(token).join(value), str);

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
    featurePreview: fill(template.featurePreview),
    featureEdit: fill(template.featureEdit),
    missingRecurringFrequency: fill(template.missingRecurringFrequency),
    debtNotFound: fill(template.debtNotFound),
    debtOverpayment: fill(template.debtOverpayment),
    savedFeature: fill(template.savedFeature),
  };
}

// Maps the user's registered language to a Whisper ISO code + the exact
// lowercase name Whisper's own API returns in `detectedLanguage` (verified
// against Whisper's official supported-language list) — the mismatch check
// in whatsapp/route.ts & telegram/route.ts does a straight string compare
// against this `name`, so it must match Whisper's naming exactly, not just
// be "a reasonable English name" for the language.
//
// Used to be English/Tamil/Sinhala only, which meant every other language
// a user could select at registration (Hindi, Spanish, Arabic, French, and
// ~65 more — see WORLD_LANGUAGES in app/register/page.tsx) silently skipped
// mismatch validation entirely. Expanded to cover every language on that
// list that Whisper actually supports. A few WORLD_LANGUAGES entries are
// intentionally left out because Whisper's own model doesn't recognise them
// as a distinct language (Igbo, Irish, Kurdish, Xhosa, Zulu) — those still
// return null here, same as before, which just means "skip the check",
// never a wrong check.
// Returns null for "Singlish" (mixed code-switched speech) so mismatch validation is skipped.
export function getWhisperLanguageInfo(userLang: string): { isoCode: string; name: string } | null {
  const key = (userLang || "").trim().toLowerCase();
  const map: Record<string, { isoCode: string; name: string }> = {
    afrikaans: { isoCode: "af", name: "afrikaans" },
    albanian: { isoCode: "sq", name: "albanian" },
    amharic: { isoCode: "am", name: "amharic" },
    arabic: { isoCode: "ar", name: "arabic" },
    armenian: { isoCode: "hy", name: "armenian" },
    azerbaijani: { isoCode: "az", name: "azerbaijani" },
    bengali: { isoCode: "bn", name: "bengali" },
    bosnian: { isoCode: "bs", name: "bosnian" },
    bulgarian: { isoCode: "bg", name: "bulgarian" },
    burmese: { isoCode: "my", name: "burmese" },
    chinese: { isoCode: "zh", name: "chinese" },
    croatian: { isoCode: "hr", name: "croatian" },
    czech: { isoCode: "cs", name: "czech" },
    danish: { isoCode: "da", name: "danish" },
    dutch: { isoCode: "nl", name: "dutch" },
    english: { isoCode: "en", name: "english" },
    estonian: { isoCode: "et", name: "estonian" },
    filipino: { isoCode: "tl", name: "tagalog" },
    finnish: { isoCode: "fi", name: "finnish" },
    french: { isoCode: "fr", name: "french" },
    georgian: { isoCode: "ka", name: "georgian" },
    german: { isoCode: "de", name: "german" },
    greek: { isoCode: "el", name: "greek" },
    gujarati: { isoCode: "gu", name: "gujarati" },
    hausa: { isoCode: "ha", name: "hausa" },
    hebrew: { isoCode: "he", name: "hebrew" },
    hindi: { isoCode: "hi", name: "hindi" },
    hungarian: { isoCode: "hu", name: "hungarian" },
    icelandic: { isoCode: "is", name: "icelandic" },
    indonesian: { isoCode: "id", name: "indonesian" },
    italian: { isoCode: "it", name: "italian" },
    japanese: { isoCode: "ja", name: "japanese" },
    kannada: { isoCode: "kn", name: "kannada" },
    kazakh: { isoCode: "kk", name: "kazakh" },
    khmer: { isoCode: "km", name: "khmer" },
    korean: { isoCode: "ko", name: "korean" },
    lao: { isoCode: "lo", name: "lao" },
    latvian: { isoCode: "lv", name: "latvian" },
    lithuanian: { isoCode: "lt", name: "lithuanian" },
    macedonian: { isoCode: "mk", name: "macedonian" },
    malay: { isoCode: "ms", name: "malay" },
    malayalam: { isoCode: "ml", name: "malayalam" },
    marathi: { isoCode: "mr", name: "marathi" },
    mongolian: { isoCode: "mn", name: "mongolian" },
    nepali: { isoCode: "ne", name: "nepali" },
    norwegian: { isoCode: "no", name: "norwegian" },
    pashto: { isoCode: "ps", name: "pashto" },
    "persian/farsi": { isoCode: "fa", name: "persian" },
    persian: { isoCode: "fa", name: "persian" },
    polish: { isoCode: "pl", name: "polish" },
    portuguese: { isoCode: "pt", name: "portuguese" },
    punjabi: { isoCode: "pa", name: "punjabi" },
    romanian: { isoCode: "ro", name: "romanian" },
    russian: { isoCode: "ru", name: "russian" },
    serbian: { isoCode: "sr", name: "serbian" },
    sindhi: { isoCode: "sd", name: "sindhi" },
    sinhala: { isoCode: "si", name: "sinhala" },
    slovak: { isoCode: "sk", name: "slovak" },
    slovenian: { isoCode: "sl", name: "slovenian" },
    somali: { isoCode: "so", name: "somali" },
    spanish: { isoCode: "es", name: "spanish" },
    swahili: { isoCode: "sw", name: "swahili" },
    swedish: { isoCode: "sv", name: "swedish" },
    tamil: { isoCode: "ta", name: "tamil" },
    telugu: { isoCode: "te", name: "telugu" },
    thai: { isoCode: "th", name: "thai" },
    turkish: { isoCode: "tr", name: "turkish" },
    ukrainian: { isoCode: "uk", name: "ukrainian" },
    urdu: { isoCode: "ur", name: "urdu" },
    uzbek: { isoCode: "uz", name: "uzbek" },
    vietnamese: { isoCode: "vi", name: "vietnamese" },
    welsh: { isoCode: "cy", name: "welsh" },
    yoruba: { isoCode: "yo", name: "yoruba" },
  };
  return map[key] || null;
}

// =====================================================================
// AI ENGINES — channel-agnostic. Each route downloads the media itself
// (Twilio auth vs Telegram getFile) and passes a Buffer in here.
// =====================================================================

// 🎤 Voice Buffer -> Text (Whisper). Caller downloads the audio file.
export async function transcribeVoiceBuffer(
  audioBuffer: Buffer,
  filename: string,
  contentType: string,
  languageHint?: string | null
): Promise<{ text: string; detectedLanguage: string } | null> {
  try {
    const FormFormat = (await import("form-data")).default;
    const axios = (await import("axios")).default;

    const formData = new FormFormat();
    formData.append("file", audioBuffer, { filename, contentType });
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    if (languageHint) formData.append("language", languageHint);

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

// The category enums the `transactions.category` column accepts.
// Keep these in lock-step with CATEGORY_OPTIONS / INCOME_CATEGORIES in
// app/dashboard/page.tsx — the dashboard comment there warns the lists must
// match EXACTLY, and category grouping (pie charts, exports) is done by
// exact string match.
export const EXPENSE_CATEGORIES = [
  "Food & Groceries",
  "Transport (Bus, Train, Fuel, Taxi)",
  "Utilities (Bills, Internet, Phone)",
  "Rent/Housing",
  "Personal Care (Medical, Saloon, Hygiene)",
  "Shopping (Clothes, Gadgets)",
  "Entertainment (Movies, Subscriptions, Outings)",
  "Education (Books, Courses)",
  "Debt/Loans",
  "Savings/Investments",
  "Gifts & Charity",
  "Miscellaneous (Unexpected)",
] as const;

// Income gets its OWN proper category set instead of being forced into the
// expense list above. Forcing it into the expense list was the root cause
// of income logging silently failing on both WhatsApp & Telegram — nothing
// on that list fits "salary" / "bonus", so the model kept returning a
// category outside the allowed set (e.g. "Salary", "Income"), which the DB
// rejected on insert. "Starting Balance" is reserved for the onboarding
// flow only — the model is never asked to pick it for a normal message.
export const INCOME_CATEGORIES = [
  "Salary/Wages",
  "Business/Freelance",
  "Investment Returns",
  "Gifts & Support Received",
  "Other Income",
] as const;

const RESERVED_INCOME_CATEGORIES = ["Starting Balance"] as const;

// Defensive layer: even if the model ignores the prompt's category list,
// never let a category outside the DB's allowed set through — that's what
// was silently breaking every income save before.
function sanitizeExtractedCategory(tx: ExtractedData): ExtractedData {
  if (!tx) return tx;
  const isIncome = tx.type === "income";
  const validSet: readonly string[] = isIncome
    ? [...INCOME_CATEGORIES, ...RESERVED_INCOME_CATEGORIES]
    : EXPENSE_CATEGORIES;
  if (!tx.category || !validSet.includes(tx.category)) {
    return {
      ...tx,
      category: isIncome ? "Other Income" : "Miscellaneous (Unexpected)",
    };
  }
  return tx;
}

// 🧠 AI Engine: Text Parser
export async function extractTransaction(
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
- CRITICAL ITEM RULE: The "item" description MUST be kept EXACTLY as the user wrote it — do NOT translate it into ${language} or any other language. Only trim whitespace / fix obvious casing; never reword or translate.
- CRITICAL CATEGORY RULE: There are TWO separate category lists — pick the one that matches the "type" you detected, and choose ONE value from it EXACTLY as written (do not translate, do not invent a new category):

  If type is "expense", choose ONE from:
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

  If type is "income", choose ONE from:
  - Salary/Wages (regular job pay, wages)
  - Business/Freelance (business or freelance earnings)
  - Investment Returns (interest, dividends, profit from investments)
  - Gifts & Support Received (money gifted or sent by someone)
  - Other Income (anything that doesn't clearly fit the above)
- Identify exactly ONE action:
  * log_transaction = ordinary income/expense
  * set_budget = budget command
  * set_starting_balance = onboarding only
  * create_recurring_expense = a repeating payment such as rent, salary deduction, subscription, bill, etc.
  * create_savings_goal = user creates a target such as "save 300000 for a laptop"
  * add_savings_contribution = user adds money to an existing savings goal
  * create_debt = user borrows money (owes someone) OR lends money (someone owes the user)
  * repay_debt = user pays back someone they owe
  * collect_debt = someone pays back money they owe the user
- NEVER guess a recurring frequency. Only set frequency when the user explicitly says daily, weekly, or monthly (including phrases like every day/week/month, per week/month).
- For recurring expenses, preserve the exact item wording, and set next_due_date to the next occurrence when it can be determined from the message; otherwise use null. day_of_month/day_of_week may be used when explicitly stated.
- For savings goals, goal_name must be the user's target name (e.g. laptop), target_amount is the requested goal amount, and for a contribution goal_name identifies the existing goal.
- For debts, person_name is the other person's name. debt_direction = owed_by_user when the user borrowed money / owes that person; owed_to_user when that person owes the user.
- For repay_debt/collect_debt, do NOT create a new debt; identify the existing person and amount being settled.

Return pure JSON:
{
  "action": "log_transaction" | "set_budget" | "set_starting_balance" | "create_recurring_expense" | "create_savings_goal" | "add_savings_contribution" | "create_debt" | "repay_debt" | "collect_debt",
  "type": "expense" | "income" | null,
  "item": "description string EXACTLY as the user typed it, no translation",
  "category": "Strictly choose ONE from the allowed list for the detected type above, or Debt/Loans for debt repayment/collection",
  "amount": number,
  "currency": "${nativeCurrency}",
  "frequency": "daily" | "weekly" | "monthly" | null,
  "next_due_date": "YYYY-MM-DD" | null,
  "day_of_month": number | null,
  "day_of_week": number | null,
  "goal_name": "string" | null,
  "target_amount": number | null,
  "target_date": "YYYY-MM-DD" | null,
  "person_name": "string" | null,
  "debt_direction": "owed_by_user" | "owed_to_user" | null
}`,
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(response.choices[0].message.content || "{}") as ExtractedData;
    // Defensive second layer: even if the model ignores the prompt above,
    // never let a category outside the DB's allowed set through.
    return sanitizeExtractedCategory(parsed);
  } catch (err) {
    console.error("❌ Text Extraction error:", err);
    return null;
  }
}

// 📸 AI Engine: Vision Receipt Parser. Caller downloads the image and passes base64 + contentType.
export async function extractFromImageBuffer(
  base64Image: string,
  contentType: string,
  nativeCurrency: string,
  language: string,
  nickname: string
): Promise<ExtractedData | null> {
  try {
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
  "currency": "${nativeCurrency}"
}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Parse receipt details accurately." },
            { type: "image_url", image_url: { url: `data:${contentType};base64,${base64Image}` } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(openAiResponse.choices[0].message.content || "{}") as ExtractedData;
    return sanitizeExtractedCategory(parsed);
  } catch (err) {
    console.error("❌ Vision Extraction error:", err);
    return null;
  }
}

// =====================================================================
// DB HELPERS — channel-agnostic via idColumn/idValue
// (idColumn is 'phone_number' for WhatsApp, 'telegram_chat_id' for Telegram)
// =====================================================================


// =====================================================================
// FEATURE HELPERS — recurring expenses, savings goals and debts
// These are intentionally saved only through the explicit Confirm flow.
// =====================================================================

function localDateString(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextDateForFrequency(
  frequency: "daily" | "weekly" | "monthly",
  base = new Date(),
  dayOfMonth?: number | null,
  dayOfWeek?: number | null
): string {
  const d = new Date(base);
  if (frequency === "daily") {
    d.setDate(d.getDate() + 1);
  } else if (frequency === "weekly") {
    if (dayOfWeek !== null && dayOfWeek !== undefined) {
      const delta = ((dayOfWeek - d.getDay()) + 7) % 7 || 7;
      d.setDate(d.getDate() + delta);
    } else {
      d.setDate(d.getDate() + 7);
    }
  } else {
    if (dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31) {
      const currentDay = d.getDate();
      if (currentDay < dayOfMonth) {
        d.setDate(1);
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        d.setDate(Math.min(dayOfMonth, lastDay));
      } else {
        d.setDate(1);
        d.setMonth(d.getMonth() + 1);
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        d.setDate(Math.min(dayOfMonth, lastDay));
      }
    } else {
      d.setMonth(d.getMonth() + 1);
    }
  }
  return localDateString(d);
}

function featureDetails(tx: ExtractedData, currency: string): string {
  const money = `${currency} ${Number(tx.amount || tx.target_amount || 0).toLocaleString()}`;
  switch (tx.action) {
    case "create_recurring_expense":
      return `🔁 *Recurring Expense*\n• ${tx.item}\n• Amount: *${money}*\n• Frequency: *${tx.frequency || "not set"}*\n• Next payment: *${tx.next_due_date || "next occurrence"}*`;
    case "create_savings_goal":
      return `🎯 *Savings Goal*\n• Goal: *${tx.goal_name || tx.item}*\n• Target: *${currency} ${Number(tx.target_amount || tx.amount || 0).toLocaleString()}*`;
    case "add_savings_contribution":
      return `💰 *Savings Contribution*\n• Goal: *${tx.goal_name || tx.item}*\n• Add: *${money}*`;
    case "create_debt":
      return `🤝 *Debt*\n• Person: *${tx.person_name || "Unknown"}*\n• Amount: *${money}*\n• ${tx.debt_direction === "owed_to_user" ? "They owe you" : "You owe them"}`;
    case "repay_debt":
      return `💸 *Debt Repayment*\n• Person: *${tx.person_name || "Unknown"}*\n• Payment: *${money}*`;
    case "collect_debt":
      return `💵 *Debt Collection*\n• Person: *${tx.person_name || "Unknown"}*\n• Received: *${money}*`;
    default:
      return "";
  }
}

function isFeatureAction(tx: ExtractedData | null): boolean {
  return !!tx && [
    "create_recurring_expense",
    "create_savings_goal",
    "add_savings_contribution",
    "create_debt",
    "repay_debt",
    "collect_debt",
  ].includes(tx.action);
}

export async function prepareFeatureExtraction(tx: ExtractedData): Promise<ExtractedData> {
  const next = { ...tx };
  if (next.action === "create_recurring_expense" && next.frequency && !next.next_due_date) {
    next.next_due_date = nextDateForFrequency(next.frequency, new Date(), next.day_of_month, next.day_of_week);
  }
  return next;
}

export async function saveConfirmedFeature(
  idColumn: UserIdColumn,
  idValue: string,
  userProfile: any,
  tx: ExtractedData,
  userLang: string,
  nickname: string,
  currency: string,
  websiteUrl: string
): Promise<string> {
  const msgs = await getLocalizedMessages(userLang, nickname, currency, websiteUrl);
  const details = featureDetails(tx, currency);
  try {
    if (tx.action === "create_recurring_expense") {
      if (!tx.frequency) return msgs.missingRecurringFrequency;
      const nextDue = tx.next_due_date || nextDateForFrequency(tx.frequency, new Date(), tx.day_of_month, tx.day_of_week);
      const { error } = await supabaseAdmin.from("recurring_expenses").insert({
        user_id: userProfile.id,
        [idColumn]: idValue,
        item: tx.item,
        category: tx.category || "Miscellaneous (Unexpected)",
        amount: tx.amount,
        currency: tx.currency || currency,
        frequency: tx.frequency,
        next_due_date: nextDue,
        day_of_month: tx.day_of_month || null,
        day_of_week: tx.day_of_week ?? null,
        active: true,
      });
      if (error) throw error;
      return msgs.savedFeature.replace("{DETAILS}", details);
    }

    if (tx.action === "create_savings_goal") {
      const target = Number(tx.target_amount || tx.amount || 0);
      if (!target || target <= 0 || !tx.goal_name) throw new Error("Invalid savings goal");
      const { data: existingGoal, error: existingErr } = await supabaseAdmin
        .from("savings_goals")
        .select("id")
        .eq("user_id", userProfile.id)
        .eq("active", true)
        .ilike("name", tx.goal_name.trim())
        .limit(1)
        .maybeSingle();
      if (existingErr) throw existingErr;
      if (existingGoal) {
        return `⚠️ You already have an active savings goal named *${tx.goal_name}*. Reply *Edit* and use a different goal name, or add money to the existing goal.`;
      }
      const { error } = await supabaseAdmin.from("savings_goals").insert({
        user_id: userProfile.id,
        name: tx.goal_name.trim(),
        target_amount: target,
        current_amount: 0,
        currency: tx.currency || currency,
        target_date: tx.target_date || null,
        active: true,
      });
      if (error) throw error;
      return msgs.savedFeature.replace("{DETAILS}", details);
    }

    if (tx.action === "add_savings_contribution") {
      const { data: goal, error: goalErr } = await supabaseAdmin
        .from("savings_goals")
        .select("*")
        .eq("user_id", userProfile.id)
        .eq("active", true)
        .ilike("name", tx.goal_name || tx.item || "")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (goalErr) throw goalErr;
      if (!goal) return `⚠️ I couldn't find an active savings goal named *${tx.goal_name || tx.item}*. Reply *Edit* and send the goal name again.`;
      const newAmount = Number(goal.current_amount || 0) + Number(tx.amount || 0);
      const { error: updateErr } = await supabaseAdmin.from("savings_goals").update({ current_amount: newAmount, updated_at: new Date().toISOString() }).eq("id", goal.id);
      if (updateErr) throw updateErr;
      // Moving cash into a savings goal is a transfer: it reduces liquid cash
      // but is added back to net worth through the goal asset balance.
      const { error: txErr } = await supabaseAdmin.from("transactions").insert({
        [idColumn]: idValue,
        user_id: userProfile.id,
        type: "expense",
        item: `Savings: ${goal.name}`,
        category: "Savings/Investments",
        amount: tx.amount,
        currency: tx.currency || currency,
      });
      if (txErr) throw txErr;
      return msgs.savedFeature.replace("{DETAILS}", `${details}\n• New balance: *${currency} ${newAmount.toLocaleString()}*`);
    }

    if (tx.action === "create_debt") {
      const principal = Number(tx.amount || 0);
      if (!principal || principal <= 0 || !tx.person_name || !tx.debt_direction) throw new Error("Invalid debt");
      const { error: debtErr } = await supabaseAdmin.from("debts").insert({
        user_id: userProfile.id,
        person_name: tx.person_name.trim(),
        principal_amount: principal,
        remaining_amount: principal,
        currency: tx.currency || currency,
        direction: tx.debt_direction,
        status: "open",
      });
      if (debtErr) throw debtErr;
      // Borrowed money increases cash; money lent out decreases cash.
      const txType = tx.debt_direction === "owed_by_user" ? "income" : "expense";
      const { error: txErr } = await supabaseAdmin.from("transactions").insert({
        [idColumn]: idValue,
        user_id: userProfile.id,
        type: txType,
        item: tx.debt_direction === "owed_by_user" ? `Borrowed from ${tx.person_name}` : `Lent to ${tx.person_name}`,
        category: "Debt/Loans",
        amount: principal,
        currency: tx.currency || currency,
      });
      if (txErr) throw txErr;
      return msgs.savedFeature.replace("{DETAILS}", details);
    }

    if (tx.action === "repay_debt" || tx.action === "collect_debt") {
      if (!tx.person_name || !tx.amount || tx.amount <= 0) throw new Error("Invalid repayment");
      const direction = tx.action === "repay_debt" ? "owed_by_user" : "owed_to_user";
      const { data: debtRows, error: debtErr } = await supabaseAdmin
        .from("debts")
        .select("*")
        .eq("user_id", userProfile.id)
        .eq("direction", direction)
        .eq("status", "open")
        .ilike("person_name", tx.person_name.trim())
        .order("created_at", { ascending: true });
      if (debtErr) throw debtErr;
      if (!debtRows || debtRows.length === 0) return msgs.debtNotFound.replace("{PERSON}", tx.person_name);
      const totalRemaining = debtRows.reduce((sum: number, d: any) => sum + Number(d.remaining_amount || 0), 0);
      if (Number(tx.amount) > totalRemaining) return msgs.debtOverpayment.replace("{PERSON}", tx.person_name);

      // Apply one repayment across every open debt for this person, oldest
      // first. This prevents multiple loans to the same person from becoming
      // disconnected balances.
      let paymentLeft = Number(tx.amount);
      let finalRemaining = totalRemaining;
      for (const debt of debtRows) {
        if (paymentLeft <= 0) break;
        const rowRemaining = Number(debt.remaining_amount || 0);
        const applied = Math.min(rowRemaining, paymentLeft);
        const rowNewRemaining = rowRemaining - applied;
        paymentLeft -= applied;
        finalRemaining -= applied;
        const { error: updateErr } = await supabaseAdmin.from("debts").update({
          remaining_amount: rowNewRemaining,
          status: rowNewRemaining === 0 ? "settled" : "open",
          updated_at: new Date().toISOString(),
        }).eq("id", debt.id);
        if (updateErr) throw updateErr;
      }
      const txType = tx.action === "repay_debt" ? "expense" : "income";
      const { error: txErr } = await supabaseAdmin.from("transactions").insert({
        [idColumn]: idValue,
        user_id: userProfile.id,
        type: txType,
        item: tx.action === "repay_debt" ? `Debt repayment to ${tx.person_name}` : `Debt received from ${tx.person_name}`,
        category: "Debt/Loans",
        amount: tx.amount,
        currency: tx.currency || currency,
      });
      if (txErr) throw txErr;
      return msgs.savedFeature.replace("{DETAILS}", `${details}\n• Remaining: *${currency} ${finalRemaining.toLocaleString()}*`);
    }

    throw new Error("Unsupported feature action");
  } catch (err) {
    console.error("❌ Feature save error:", err);
    return msgs.dbError;
  }
}

// Save Extracted Transaction/Budget Directly (used for TEXT input — no Confirm/Edit step)
export async function saveExtractedDirect(
  idColumn: UserIdColumn,
  idValue: string,
  userProfile: any,
  tx: ExtractedData,
  userLang: string,
  nickname: string,
  currency: string,
  websiteUrl: string
): Promise<string> {
  tx = sanitizeExtractedCategory(tx);
  const formattedAmount = Number(tx.amount).toLocaleString();
  const baseMsgs = await getLocalizedMessages(userLang, nickname, currency, websiteUrl);
  const typeTag = tx.type === "income" ? baseMsgs.typeIncome : baseMsgs.typeExpense;
  const msgs = await getLocalizedMessages(userLang, nickname, currency, websiteUrl, { item: tx.item, amount: formattedAmount, category: tx.category, typeTag });

  try {
    if (tx.action === "set_budget") {
      // upsert (not insert): if this user already has a budget row for this
      // category, UPDATE its amount_limit instead of creating a duplicate
      // row — duplicates make the dashboard's "Overall Monthly Budget" total
      // silently inflate every time a budget is re-set via chat.
      const { error: budgetErr } = await supabaseAdmin.from("budgets").upsert(
        [
          {
            [idColumn]: idValue,
            user_id: userProfile.id,
            category: tx.category || "General",
            amount_limit: tx.amount,
          },
        ],
        { onConflict: "user_id,category" }
      );
      if (budgetErr) throw budgetErr;
      return msgs.budgetSaved;
    }

    const { error: insErr } = await supabaseAdmin.from("transactions").insert([
      {
        [idColumn]: idValue,
        user_id: userProfile.id,
        type: tx.type,
        item: tx.item,
        category: tx.category,
        amount: tx.amount,
        currency: tx.currency || userProfile.currency,
      },
    ]);
    if (insErr) throw insErr;

    await supabaseAdmin
      .from("users")
      .update({ daily_tx_count: (userProfile.daily_tx_count || 0) + 1 })
      .eq(idColumn, idValue);

    return msgs.savedMsg;
  } catch (err) {
    console.error("❌ Direct Save Error:", err);
    return msgs.dbError;
  }
}

// DB Handler: Multi-language Confirmation Response (used for VOICE/IMAGE preview -> Confirm flow)
export async function handleConfirmTransaction(
  idColumn: UserIdColumn,
  idValue: string,
  userProfile: any,
  userLang: string,
  nickname: string,
  currency: string,
  websiteUrl: string
): Promise<string> {
  try {
    const { data: session } = await supabaseAdmin
      .from("user_sessions")
      .select("pending_transaction")
      .eq(idColumn, idValue)
      .single();

    const emptyMsgs = await getLocalizedMessages(userLang, nickname, currency, websiteUrl);

    if (!session?.pending_transaction) {
      return emptyMsgs.noPending;
    }

    const tx = sanitizeExtractedCategory(session.pending_transaction as ExtractedData);
    const formattedAmount = Number(tx.amount || tx.target_amount || 0).toLocaleString();

    // Feature records (recurring payments, savings goals, debts) are never
    // auto-saved. They reach this function only after the user explicitly
    // replied with Confirm.
    if ([
      "create_recurring_expense",
      "create_savings_goal",
      "add_savings_contribution",
      "create_debt",
      "repay_debt",
      "collect_debt",
    ].includes(tx.action)) {
      const featureResult = await saveConfirmedFeature(idColumn, idValue, userProfile, tx, userLang, nickname, currency, websiteUrl);
      await supabaseAdmin.from("user_sessions").update({ pending_transaction: null, step: "ACTIVE" }).eq(idColumn, idValue);
      return featureResult;
    }
    const isIncome = tx.type === "income";

    const typeTag = isIncome ? emptyMsgs.typeIncome : emptyMsgs.typeExpense;

    const msgs = await getLocalizedMessages(userLang, nickname, currency, websiteUrl, {
      item: tx.item,
      amount: formattedAmount,
      isIncome,
      category: tx.category,
      typeTag,
    });

    if (tx.action === "set_budget") {
      // Same upsert fix as saveExtractedDirect — avoids duplicate budget
      // rows when a category budget is re-set through the confirm flow.
      const { error: budgetErr } = await supabaseAdmin.from("budgets").upsert(
        [
          {
            [idColumn]: idValue,
            user_id: userProfile.id,
            category: tx.category || "General",
            amount_limit: tx.amount,
          },
        ],
        { onConflict: "user_id,category" }
      );
      if (budgetErr) throw budgetErr;

      await supabaseAdmin.from("user_sessions").update({ pending_transaction: null, step: "ACTIVE" }).eq(idColumn, idValue);
      return msgs.budgetSaved;
    }

    const { error: insErr } = await supabaseAdmin.from("transactions").insert([
      {
        [idColumn]: idValue,
        user_id: userProfile.id,
        type: tx.type,
        item: tx.item,
        category: tx.category,
        amount: tx.amount,
        currency: tx.currency || userProfile.currency,
      },
    ]);
    if (insErr) throw insErr;

    await supabaseAdmin
      .from("users")
      .update({ daily_tx_count: (userProfile.daily_tx_count || 0) + 1 })
      .eq(idColumn, idValue);

    await supabaseAdmin.from("user_sessions").update({ pending_transaction: null, step: "ACTIVE" }).eq(idColumn, idValue);

    return msgs.savedMsg;
  } catch (err) {
    console.error("❌ DB Insert Error:", err);
    const msgs = await getLocalizedMessages(userLang, nickname, currency, websiteUrl);
    return msgs.dbError;
  }
}

// ---------------------- Small shared text snippets ----------------------
export function getRegisterMessage(websiteUrl: string): string {
  return `👋 Hey there, welcome to Brofinai!\n\nLet's get you set up — please complete your quick registration here:\n👉 ${websiteUrl}/register`;
}

export function getLinkMessage(nickname: string, websiteUrl: string): string {
  return `🔗 Hey ${nickname}, here's your Brofinai login link:\n👉 ${websiteUrl}/login`;
}

export function getExcelLockedMessage(nickname: string, websiteUrl: string = "https://brofinai.com"): string {
  return `📊 *Excel Exports & Budget Handling - Locked*\n\n${nickname}, Excel Export එක Instant Download කිරීමයි, Monthly Budget Limits සකසීමයි Broo LITE Plan එකේ ලබාගත නොහැක.\n\n🔓 *Unlock Core Features - $2.55/mo:*\n• One-Click Excel Export\n• Smart Budget Handling\n• 10 Daily Logs + Voice Tracking\n\n🔗 Upgrade Now: ${websiteUrl}/register?plan=core`;
}