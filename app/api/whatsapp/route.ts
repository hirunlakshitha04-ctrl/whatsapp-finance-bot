import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { OpenAI } from "openai";
import { supabase } from "@/lib/supabase"; 
import twilio from "twilio";
import FormFormat from "form-data";

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
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const TWILIO_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

// 🌍 ULTIMATE FORMATTED MULTI-LANGUAGE SYSTEM MESSAGES
async function getLocalizedMessages(
  lang: string, 
  nickname: string, 
  currency: string, 
  websiteUrl: string, 
  contextData: { amount?: string; item?: string; isIncome?: boolean; typeTag?: string; category?: string } = {}
): Promise<LocalizedMessages> {
  const targetLang = (lang || "English").trim();

  // 1. SINGLISH FORMATTED TEMPLATE
  if (targetLang.toLowerCase() === "singlish") {
    return {
      welcome: `👋 සාදරයෙන් පිළිගන්නවා ${nickname}!\n\nමම ඔයාගේ Personal Finance Assistant *Broo.ai*! 🚀\n\nවැඩේ ලස්සනට පටන් ගන්න, **දැනට ඔයා ගාව/Bank Account එකේ තියෙන ආරම්භක මුදල (Starting Capital)** කීයද කියන්න?\n\n💡 උදාහරණ: *"50000"* හෝ *"25000"*`,
      
      guidelines: `🎯 නියමයි ${nickname}! ඔයාගේ Starting Balance එක *${currency} ${contextData.amount || "0"}* විදිහට Set කරගත්තා! 🎉\n\n--- 💡 *Broo.ai Quick Guide* ---\n\n💸 *Expense එකක් දාන්න:*\n| "Spent 500 for lunch" / "Bus fare 80"\n\n💰 *Income එකක් එකතු කරන්න:*\n| "Salary labuna 150000" / "Got bonus 10000"\n\n🎯 *Monthly Budget එකක් set කරන්න:*\n| "Set budget 50000"\n\n🚀 *දැන් ඔයාගේ පළවෙනි Expense එක හරි Income එක හරි එවලා බලන්න!*`,
      
      proFeatureImage: `🔒 *AI Receipt Scanning is a Pro Feature!*\n\n${nickname}, **BROO LITE** plan එකෙන් Receipt photos scan කරන්න බෑ. Upgrade වෙන්න:\n👉 ${websiteUrl}/#pricing`,
      proFeatureVoice: `🔒 *Voice Notes is a Pro Feature!*\n\n${nickname}, Voice Notes පහසුකම භාවිතා කිරීමට Pro Plan එකකට Upgrade වෙන්න:\n👉 ${websiteUrl}/#pricing`,
      limitReached: `⚠️ *Monthly Receipt Limit Reached (30/30 Scans)*\n\n${nickname}, මේ මාසෙ Scans 30ම ඉවරයි. Unlimited Scans සඳහා **BROO MAX** වලට Upgrade වෙන්න!\n👉 ${websiteUrl}/#pricing`,
      noPending: `⚠️ Hi ${nickname}, confirm කරන්න කිසිම pending transaction එකක් නෑනේ!`,
      budgetSaved: `🎯 එළකිරි ${nickname}! ඔයාගේ මේ මාසෙ Budget එක *${currency} ${contextData.amount || "0"}* විදිහට සේව් කරගත්තා! 🚀`,
      savedMsg: `එළකිරි ${nickname}! *${contextData.item || ""}* එකට ${contextData.isIncome ? 'ලැබුණු' : 'ගිය'} *${currency} ${contextData.amount || "0"}* සේව් කරගත්තා! ${contextData.isIncome ? '🎉' : '🚀'}`,
      autoSavedMsg: `⚡ *Auto Saved!* (Broo Max feature)\n\nඑළකිරි ${nickname}! *${contextData.item || ""}* එකට ගිය *${currency} ${contextData.amount || "0"}* සේව් කරගත්තා! 🚀`,
      dbError: `🚨 Database එකට Save වෙද්දී අවුලක් වුණා මචං. ආයේ Try එකක් දෙමුද?`,
      directError: `🚨 Direct save වෙද්දී අවුලක් වුණා මචං.`,
      editCancel: `අවුලක් නෑ ${nickname}! නිවැරදි විස්තරේ ආයේ එවපන්.`,
      fallback: `Sorry ${nickname}, මට ඒක පැහැදිලි වුණේ නෑ බං. "Spent 500 for lunch" වගේ text එකක් එවන්න! 🚀`,
      
      preview: `📝 විස්තරය: *${contextData.item || ""}*\n🏷️ වර්ගය: *${contextData.typeTag || ""}*\n🗂️ කාණ්ඩය: *${contextData.category || ""}*\n💰 ගාණ: *${currency} ${contextData.amount || "0"}*\n\n-> හරිනම් *Confirm* කියලා reply කරපන්.\n-> වැරදියි නම් *Edit* කියලා reply කරපන්.`
    };
  }

  // 2. DYNAMIC TRANSLATION ENGINE FOR ALL OTHER DROPDOWN LANGUAGES
  try {
    const prompt = `You are generating formatted WhatsApp UI system messages for "Broo.ai" (a personal finance bot).
Target User Language: "${targetLang}".
User Nickname: "${nickname}".
Currency Code: "${currency}".
Website URL: "${websiteUrl}/#pricing".

Dynamic values to embed:
- amount: "${contextData.amount || ''}"
- item: "${contextData.item || ''}"
- typeTag: "${contextData.typeTag || ''}"
- category: "${contextData.category || ''}"

Return pure JSON with localized texts in "${targetLang}". Keep all WhatsApp formatting marks like *, _, |, --- intact!

{
  "welcome": "👋 Welcome ${nickname}!\\n\\nI am your Personal Finance Assistant *Broo.ai*! 🚀\\n\\nTo start, what is your current **Starting Balance / Capital** in your account?\\n\\n💡 Example: *\\\"50000\\\"* or *\\\"25000\\\"*",
  
  "guidelines": "🎯 Awesome ${nickname}! Your **Starting Balance** is set to *${currency} ${contextData.amount || '0'}*! 🎉\\n\\n--- 💡 *Broo.ai Quick Guide* ---\\n\\n💸 *Log Expense:*\\n| \\\"Spent 500 for lunch\\\" / \\\"Bus fare 80\\\"\\n\\n💰 *Add Income:*\\n| \\\"Got salary 150000\\\" / \\\"Got bonus 10000\\\"\\n\\n🎯 *Set Monthly Budget:*\\n| \\\"Set budget 50000\\\"\\n\\n🚀 *Send your first Expense or Income now!*",
  
  "proFeatureImage": "🔒 *AI Receipt Scanning is a Pro Feature!*\\n\\n${nickname}, upgrade to Broo Core or Max:\\n👉 ${websiteUrl}/#pricing",
  "proFeatureVoice": "🔒 *Voice Notes is a Pro Feature!*\\n\\n${nickname}, upgrade to Broo Core or Max:\\n👉 ${websiteUrl}/#pricing",
  "limitReached": "⚠️ *Monthly Receipt Limit Reached (30/30 Scans)*\\n\\n${nickname}, upgrade to BROO MAX:\\n👉 ${websiteUrl}/#pricing",
  "noPending": "⚠️ Hi ${nickname}, there is no pending transaction to confirm!",
  "budgetSaved": "🎯 Awesome ${nickname}! Your monthly budget is set to *${currency} ${contextData.amount || '0'}*! 🚀",
  "savedMsg": "Awesome ${nickname}! Saved *${currency} ${contextData.amount || '0'}* for *${contextData.item || ''}*! 🚀",
  "autoSavedMsg": "⚡ *Auto Saved!*\\n\\nAwesome ${nickname}! Saved *${currency} ${contextData.amount || '0'}* for *${contextData.item || ''}*! 🚀",
  "dbError": "🚨 An error occurred while saving to database.",
  "directError": "🚨 An error occurred during direct save.",
  "editCancel": "No problem ${nickname}! Send the corrected details.",
  "fallback": "Sorry ${nickname}, I couldn't understand that. Try sending \\\"Spent 500 for lunch\\\"! 🚀",
  
  "preview": "📝 Description: *${contextData.item || ''}*\\n🏷️ Type: *${contextData.typeTag || ''}*\\n🗂️ Category: *${contextData.category || ''}*\\n💰 Amount: *${currency} ${contextData.amount || '0'}*\\n\\n-> Reply *Confirm* to save.\\n-> Reply *Edit* to change."
}`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(res.choices[0].message.content || "{}") as LocalizedMessages;
  } catch (err) {
    console.error("❌ Translation Engine Error:", err);
    return {
      welcome: `👋 Welcome ${nickname}!\n\nI am your Personal Finance Assistant *Broo.ai*! 🚀`,
      guidelines: `🎯 Awesome ${nickname}! Your **Starting Balance** is set to *${currency} ${contextData.amount || "0"}*! 🎉\n\n--- 💡 *Broo.ai Quick Guide* ---\n\n💸 *Log Expense:*\n| "Spent 500 for lunch" / "Bus fare 80"\n\n💰 *Add Income:*\n| "Salary labuna 150000"\n\n🎯 *Set Monthly Budget:*\n| "Set budget 50000"`,
      proFeatureImage: `🔒 *AI Receipt Scanning is a Pro Feature!*\n👉 ${websiteUrl}/#pricing`,
      proFeatureVoice: `🔒 *Voice Notes is a Pro Feature!*\n👉 ${websiteUrl}/#pricing`,
      limitReached: `⚠️ *Monthly Receipt Limit Reached (30/30 Scans)*`,
      noPending: `⚠️ Hi ${nickname}, there is no pending transaction to confirm!`,
      budgetSaved: `🎯 Saved! Your budget is *${currency} ${contextData.amount || "0"}*!`,
      savedMsg: `Awesome ${nickname}! Saved *${currency} ${contextData.amount || "0"}* for *${contextData.item || ""}*!`,
      autoSavedMsg: `⚡ *Auto Saved!*\n\nSaved *${currency} ${contextData.amount || "0"}* for *${contextData.item || ""}*!`,
      dbError: `🚨 An error occurred while saving to database.`,
      directError: `🚨 An error occurred during direct save.`,
      editCancel: `No problem ${nickname}! Send the corrected details.`,
      fallback: `Sorry ${nickname}, I couldn't understand that.`,
      preview: `📝 Description: *${contextData.item || ""}*\n🏷️ Type: *${contextData.typeTag || ""}*\n🗂️ Category: *${contextData.category || ""}*\n💰 Amount: *${currency} ${contextData.amount || "0"}*\n\n-> Reply *Confirm* to save.\n-> Reply *Edit* to change.`
    };
  }
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

  const formattedAmount = tx.amount.toLocaleString();
  const msgs = await getLocalizedMessages(userLang, nickname, currency, websiteUrl, { item: tx.item, amount: formattedAmount });

  if (error) {
    console.error("❌ Auto Save Error:", error);
    return msgs.directError;
  }

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
    const formattedAmount = tx.amount.toLocaleString();
    const isIncome = tx.type === 'income';

    const msgs = await getLocalizedMessages(userLang, nickname, currency, websiteUrl, { 
      item: tx.item, 
      amount: formattedAmount, 
      isIncome 
    });

    // Handle Budget Set
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
    const { data: userProfile } = await supabase.from('users').select('*').eq('phone_number', from).maybeSingle();

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
    
    // READ USER'S SELECTED LANGUAGE FROM DATABASE (Matches Dropdown values)
    const userLang = userProfile.language || userProfile.preferred_language || "English";
    const nickname = userProfile.how_to_call_you || userProfile.nickname || userProfile.name || "Bro";
    const userCurrency = userProfile.base_currency || userProfile.currency || "LKR";

    // User Plan Identification: 'lite' | 'core' | 'max'
    const userPlan = (userProfile.plan || "lite").toLowerCase();

    // 2️⃣ PLAN CHECKS & FEATURE LIMITATIONS
    const isImage = mediaUrl && mediaContentType.startsWith("image/");
    const isAudio = mediaUrl && mediaContentType.startsWith("audio/");

    // Fetch basic localized notices
    const baseMsgs = await getLocalizedMessages(userLang, nickname, userCurrency, websiteUrl);

    // 🛑 BROO LITE LIMITS
    if (userPlan === "lite") {
      if (isImage) {
        await twilioClient.messages.create({ from: TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${from}`, body: baseMsgs.proFeatureImage });
        return new NextResponse("OK", { status: 200 });
      }
      if (isAudio) {
        await twilioClient.messages.create({ from: TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${from}`, body: baseMsgs.proFeatureVoice });
        return new NextResponse("OK", { status: 200 });
      }
    }

    // 🛑 BROO CORE LIMITS
    if (userPlan === "core" && isImage) {
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

        const guideMsgs = await getLocalizedMessages(userLang, nickname, userCurrency, websiteUrl, { amount: extracted.amount.toLocaleString() });

        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${from}`,
          body: guideMsgs.guidelines,
        });
        return new NextResponse("OK", { status: 200 });
      }
    }

    // 6️⃣ CONFIRM / EDIT HANDLERS
    if (normalizedBody === "confirm") {
      const respMessage = await handleConfirmTransaction(from, userProfile, userLang, nickname, userCurrency, websiteUrl);
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: respMessage,
      });
      return new NextResponse("OK", { status: 200 });
    }

    if (normalizedBody === "edit") {
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

      await supabase.from('user_sessions').update({ pending_transaction: extractedTx }).eq('phone_number', from);
      
      const formattedNumber = extractedTx.amount.toLocaleString();
      const typeTag = extractedTx.type === 'income' ? '🟢 Income' : '🔴 Expense';
      
      const previewMsgs = await getLocalizedMessages(userLang, nickname, userCurrency, websiteUrl, {
        item: extractedTx.item,
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