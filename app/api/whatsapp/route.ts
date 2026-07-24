import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { OpenAI } from "openai";
import { supabase } from "@/lib/supabase"; 
import twilio from "twilio";
import FormFormat from "form-data";

// Types Definition
interface ExtractedData {
  action: "log_transaction" | "set_budget";
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

// Updated to Twilio Sandbox WhatsApp Number
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
          content: `You are Broo.ai, a smart financial assistant bot.
User Profile Details:
- Preferred Language: "${language}" (English, Sinhala, Singlish, Arabic, Tamil, etc.)
- Call User As: "${nickname}"
- Base Currency: "${nativeCurrency}"

Determine action:
1. 'log_transaction' -> For Expenses, Income, Loans.
2. 'set_budget' -> For setting monthly budgets.

Category list: [Food, Transport, Bills, Shopping, Entertainment, Medical, Education, Salary, Loan, Budget, Other].

Return pure JSON matching this schema:
{
  "action": "log_transaction" | "set_budget",
  "type": "expense" | "income" | "loan_given" | "loan_taken" | "loan_settled" | null,
  "item": "clear description string",
  "category": "String",
  "amount": number,
  "person": "string" | null,
  "currency": "${nativeCurrency}",
  "confirmation_message": "Friendly confirmation text strictly written in the user's preferred language (${language}) addressing them as (${nickname}), summarizing the item/amount, and asking to reply 'Confirm' or 'Edit'."
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
          content: `Extract financial total and merchant from this receipt. Currency: ${nativeCurrency}. Output JSON:
{
  "action": "log_transaction",
  "type": "expense",
  "item": "Merchant/Store Name",
  "category": "Food" | "Transport" | "Bills" | "Shopping" | "Entertainment" | "Medical" | "Education" | "Other",
  "amount": number,
  "person": null,
  "currency": "${nativeCurrency}",
  "confirmation_message": "Friendly confirmation text strictly in user's preferred language (${language}) addressing them as (${nickname}) summarizing the extracted receipt details and asking to reply 'Confirm' or 'Edit'."
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

// 4. 💾 DB Handler: Confirmation Logic with Dynamic Response
async function handleConfirmTransaction(phoneNumber: string, userProfile: any): Promise<string> {
  try {
    const { data: session } = await supabase
      .from('user_sessions')
      .select('pending_transaction')
      .eq('phone_number', phoneNumber)
      .single();

    const nickname = userProfile.how_to_call_you || userProfile.nickname || userProfile.name || "Bro";
    const userLang = userProfile.preferred_language || userProfile.language || "Singlish";

    if (!session?.pending_transaction) {
      return `⚠️ Hi ${nickname}, no pending transaction found to confirm!`;
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

      return `🎯 ${nickname}, your monthly budget of ${tx.currency} ${tx.amount} has been saved successfully!`;
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

    // AI Dynamic Confirmation Response in User's Language
    const aiSavePrompt = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: `Generate a short success message in user's language (${userLang}). Address user as: "${nickname}". Mention Item: "${tx.item}", Category: "${tx.category}", Amount: "${tx.currency} ${tx.amount}". Add friendly emojis.`
      }]
    });

    return aiSavePrompt.choices[0].message.content || `✅ Saved ${tx.item} (${tx.currency} ${tx.amount})`;
  } catch (err) {
    console.error("❌ DB Insert Error:", err);
    return "🚨 Database save failed. Please try again.";
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

    // Fetch User Profile
    const { data: userProfile } = await supabase.from('users').select('*').eq('phone_number', from).maybeSingle();

    // UNREGISTERED USER
    if (!userProfile) {
      const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";
      const registerMsg = `👋 Welcome to Broo.ai!\n\nYou are not registered yet. Please complete your profile first:\n👉 ${websiteUrl}/register`;
      
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

    // FREE TRIAL EXPIRY CHECK
    const now = new Date();
    const trialEndsAt = userProfile.trial_ends_at ? new Date(userProfile.trial_ends_at) : null;
    const isPaid = userProfile.is_paid || false;

    if (!isPaid && trialEndsAt && now > trialEndsAt) {
      const expiredMsg = `⏳ Hey ${nickname}! Your 7-Day Free Trial has expired.\n\nSubscribe here to continue tracking: 👉 ${websiteUrl}/checkout?phone=${encodeURIComponent(from)}`;
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: expiredMsg,
      });
      return new NextResponse("OK", { status: 200 });
    }

    // SESSION VERIFICATION
    const { data: sessionState } = await supabase.from('user_sessions').select('*').eq('phone_number', from).maybeSingle();

    if (!sessionState) {
      await supabase.from('user_sessions').insert({ phone_number: from, step: 'ACTIVE' });
      const welcomeMsg = `👋 Welcome ${nickname}!\n\nYour Broo.ai account is active in **${userCurrency}**!\nSend a text, voice note 🎙️, or receipt photo 📸 to start tracking! 🚀`;
      
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: welcomeMsg,
      });
      return new NextResponse("OK", { status: 200 });
    }

    // CONFIRM / EDIT HANDLERS
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
      const cancelMsg = `No problem ${nickname}! Please send the corrected details.`;
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: cancelMsg,
      });
      return new NextResponse("OK", { status: 200 });
    }

    // EXTRACTION ENGINE (IMAGE / VOICE / TEXT)
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

    // SEND PREVIEW TO USER
    if (extractedTx && extractedTx.amount) {
      await supabase.from('user_sessions').update({ pending_transaction: extractedTx }).eq('phone_number', from);
      
      const previewMsg = extractedTx.confirmation_message || 
        `📝 Item: *${extractedTx.item}*\n🗂️ Category: *${extractedTx.category}*\n💰 Amount: *${extractedTx.currency} ${extractedTx.amount}*\n\nReply *Confirm* or *Edit*`;
      
      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${from}`,
        body: previewMsg,
      });
    } else {
      const fallbackMsg = `Sorry ${nickname}, I couldn't clearly parse that. Try something like "Spent 500 for lunch", send a voice note, or a receipt photo! 🚀`;
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