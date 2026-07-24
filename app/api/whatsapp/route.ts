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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

// Twilio Sandbox WhatsApp Number
const TWILIO_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

// 1. 🎤 Voice to Text Transcriber (Whisper API)
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

// 2. 🧠 AI Engine: Text / Voice Parser
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
User Profile: Language: "${language}", Call User As: "${nickname}", Currency: "${nativeCurrency}".

INSTRUCTIONS:
- Parse whether the input is an 'expense', 'income', 'loan', 'set_budget', or 'set_starting_balance'.
- Keep item name short, simple, and clean.

Categories: [Food, Transport, Bills, Shopping, Entertainment, Medical, Education, Salary, Starting Balance, Loan, Budget, Other].

Return pure JSON:
{
  "action": "log_transaction" | "set_budget" | "set_starting_balance",
  "type": "expense" | "income" | "loan_given" | "loan_taken" | "loan_settled" | null,
  "item": "clear description string",
  "category": "Category name",
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

// 3. 📸 AI Engine: Vision Receipt Parser
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
          content: `Extract total amount and merchant from receipt. Base Currency: ${nativeCurrency}.
Return pure JSON:
{
  "action": "log_transaction",
  "type": "expense",
  "item": "Merchant/Store Name",
  "category": "Food" | "Transport" | "Bills" | "Shopping" | "Entertainment" | "Medical" | "Education" | "Other",
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

// 4. 💾 DB Handler: Safe Multi-language Confirmation Response
async function handleConfirmTransaction(phoneNumber: string, userProfile: any): Promise<string> {
  try {
    const { data: session } = await supabase
      .from('user_sessions')
      .select('pending_transaction')
      .eq('phone_number', phoneNumber)
      .single();

    const nickname = userProfile.how_to_call_you || userProfile.nickname || userProfile.name || "Bro";
    const userLang = (userProfile.preferred_language || userProfile.language || "singlish").toLowerCase();

    if (!session?.pending_transaction) {
      return `⚠️ Hi ${nickname}, confirm කරන්න කිසිම pending transaction එකක් නෑනේ!`;
    }

    const tx = session.pending_transaction as ExtractedData;

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

      return `🎯 එළකිරි ${nickname}! ඔයාගේ මේ මාසෙ Budget එක ${tx.currency} ${tx.amount.toLocaleString()} විදිහට සේව් කරගත්තා! 🚀`;
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

    // Format Amount safely with commas
    const formattedAmount = `${tx.currency} ${tx.amount.toLocaleString()}`;
    const isIncome = tx.type === 'income';

    // MULTI-LANGUAGE RESPONSES
    if (userLang.includes("sinhala") || userLang.includes("සිංහල")) {
      const verb = isIncome ? "ලැබුණු" : "ගිය";
      const emoji = isIncome ? "🎉" : "🚀";
      return `එළකිරි ${nickname}! ${tx.item} එකට ${verb} *${formattedAmount}* සේව් කරගත්තා! ${emoji}`;
    } 
    else if (userLang.includes("arabic") || userLang.includes("العربية")) {
      const verb = isIncome ? "تمت إضافة" : "تم تسجيل";
      return `ممتاز ${nickname}! ${verb} *${formattedAmount}* لـ ${tx.item} بنجاح! 🎉`;
    } 
    else if (userLang.includes("tamil") || userLang.includes("தமிழ்")) {
      return `சூப்பர் ${nickname}! ${tx.item} தொகை *${formattedAmount}* சேமிக்கப்பட்டது! 🎉`;
    } 
    else {
      // Default: Singlish / English
      const verb = isIncome ? "ලැබුණු" : "ගිය";
      const emoji = isIncome ? "🎉" : "🚀";
      return `එළකිරි ${nickname}! ${tx.item} එකට ${verb} *${formattedAmount}* සේව් කරගත්තා! ${emoji}`;
    }

  } catch (err) {
    console.error("❌ DB Insert Error:", err);
    return "🚨 Database එකට Save වෙද්දී අවුලක් වුණා මචං. ආයේ Try එකක් දෙමුද?";
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
      const registerMsg = `👋 Welcome to Broo.ai!\n\nමචං ඔයා තවම Register වෙලා නෑ. කලින් මෙතනින් Profile එක complete කරලා එන්නකෝ:\n👉 ${websiteUrl}/register`;
      
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: registerMsg,
      });
      return new NextResponse("OK", { status: 200 });
    }

    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";
    const userLang = userProfile.preferred_language || userProfile.language || "Singlish";
    const nickname = userProfile.how_to_call_you || userProfile.nickname || userProfile.name || "Bro";
    const userCurrency = userProfile.base_currency || userProfile.currency || "LKR";

    // 2️⃣ FREE TRIAL EXPIRY CHECK
    const now = new Date();
    const trialEndsAt = userProfile.trial_ends_at ? new Date(userProfile.trial_ends_at) : null;
    const isPaid = userProfile.is_paid || false;

    if (!isPaid && trialEndsAt && now > trialEndsAt) {
      const expiredMsg = `⏳ Machan ${nickname}! ඔයාගේ 7-Day Free Trial එක ඉවරයි බං.\n\nදිගටම track කරන්න මෙතනින් Subscribe වෙන්න: 👉 ${websiteUrl}/checkout?phone=${encodeURIComponent(from)}`;
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: expiredMsg,
      });
      return new NextResponse("OK", { status: 200 });
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
      
      const welcomeMessage = `👋 සාදරයෙන් පිළිගන්නවා ${nickname}!\n\nමම ඔයාගේ Personal Finance Assistant *Broo.ai*! 🚀\n\nවැඩේ ලස්සනට පටන් ගන්න, **දැනට ඔයා ගාව/Bank Account එකේ තියෙන ආරම්භක මුදල (Starting Capital)** කීයද කියන්න?\n\n💡 Example: *"Mage gava 50000 thiyenava"* හෝ *"25000"*`;

      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: welcomeMessage,
      });
      return new NextResponse("OK", { status: 200 });
    }

    // 5️⃣ STEP: AWAITING STARTING BALANCE
    if (sessionState?.step === 'AWAITING_STARTING_BALANCE') {
      const extracted = await extractTransaction(body, userCurrency, userLang, nickname);

      if (extracted && extracted.amount) {
        // Save Starting Balance as Initial Income
        await supabase.from('transactions').insert([{
          phone_number: from,
          type: 'income',
          item: 'Starting Capital',
          category: 'Starting Balance',
          amount: extracted.amount,
          currency: userCurrency
        }]);

        // Change User Step to Active
        await supabase.from('user_sessions').update({ step: 'ACTIVE' }).eq('phone_number', from);

        // Send Success Message + User Friendly Guidelines
        const guidelineMsg = `🎯 නියමයි ${nickname}! ඔයාගේ Starting Balance එක *${userCurrency} ${extracted.amount.toLocaleString()}* විදිහට Set කරගත්තා! 🎉\n\n--- 💡 *Broo.ai Quick Guide* ---\n\n💸 *Expense එකක් දාන්න:* \n> "Spent 500 for lunch" / "Bus fare 80"\n> (Voice note 🎙️ / Receipt Photo 📸 එවන්නත් පුළුවන්)\n\n💰 *Income එකක් එකතු කරන්න:*\n> "Salary labuna 150000" / "Got bonus 10000"\n\n🎯 *Monthly Budget එකක් set කරන්න:*\n> "Set budget 50000"\n\n🚀 *දැන් ඔයාගේ පළවෙනි Expense එක හරි Income එක හරි එවලා බලන්න!*`;

        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${from}`,
          body: guidelineMsg,
        });
        return new NextResponse("OK", { status: 200 });
      }
    }

    // 6️⃣ CONFIRM / EDIT HANDLERS
    if (normalizedBody === "confirm") {
      const respMessage = await handleConfirmTransaction(from, userProfile);
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: respMessage,
      });
      return new NextResponse("OK", { status: 200 });
    }

    if (normalizedBody === "edit") {
      await supabase.from('user_sessions').update({ pending_transaction: null }).eq('phone_number', from);
      const cancelMsg = `අවුලක් නෑ ${nickname}! නිවැරදි විස්තරේ ආයේ එවපන්.`;
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: cancelMsg,
      });
      return new NextResponse("OK", { status: 200 });
    }

    // 7️⃣ EXTRACTION ENGINE (IMAGE / VOICE / TEXT)
    let extractedTx: ExtractedData | null = null;

    if (mediaUrl) {
      if (mediaContentType.startsWith("image/")) {
        extractedTx = await extractFromImage(mediaUrl, mediaContentType, TWILIO_SID, TWILIO_TOKEN, userCurrency, userLang, nickname);
      } else if (mediaContentType.startsWith("audio/")) {
        const transcribedText = await transcribeVoice(mediaUrl, TWILIO_SID, TWILIO_TOKEN);
        if (transcribedText) {
          extractedTx = await extractTransaction(transcribedText, userCurrency, userLang, nickname);
        }
      }
    } else if (body) {
      extractedTx = await extractTransaction(body, userCurrency, userLang, nickname);
    }

    // 8️⃣ SEND PREVIEW TO USER
    if (extractedTx && extractedTx.amount) {
      await supabase.from('user_sessions').update({ pending_transaction: extractedTx }).eq('phone_number', from);
      
      const formattedNumber = extractedTx.amount.toLocaleString();
      const typeTag = extractedTx.type === 'income' ? '🟢 Income (ආදායම)' : '🔴 Expense (වියදම)';
      
      const previewMsg = `📝 විස්තරය: *${extractedTx.item}*\n🏷️ වර්ගය: *${typeTag}*\n🗂️ කාණ්ඩය: *${extractedTx.category}*\n💰 ගාණ: *${extractedTx.currency} ${formattedNumber}*\n\n-> හරිනම් *Confirm* කියලා reply කරපන්.\n-> වැරදියි නම් *Edit* කියලා reply කරපන්.`;
      
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: previewMsg,
      });
    } else {
      const fallbackMsg = `Sorry ${nickname}, මට ඒක පැහැදිලි වුණේ නෑ බං. "Spent 500 for lunch" වගේ text එකක්, voice note එකක් හෝ receipt photo එකක් දාන්න! 🚀`;
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: fallbackMsg,
      });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Fatal Webhook Error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}