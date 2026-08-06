import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

interface ParsedTransaction {
  amount: number;
  category: string;
  currency: string;
  language: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const body = ((formData.get("Body") as string) || "").trim();
    const numMedia = parseInt((formData.get("NumMedia") as string) || "0");
    const mediaUrl = formData.get("MediaUrl0") as string;
    const mediaType = formData.get("ContentType0") as string;

    // 1. Fetch User Profile & Persistent Language/Currency from Database
    let { data: user } = await supabase.from("users").select("*").eq("phone_number", from).single();
    
    if (!user) {
      // User නැතිනම් default ලෙස 'English' (code: 'en') හා 'USD' යොදයි
      const { data: newUser } = await supabase.from("users").insert([{ 
        phone_number: from, 
        preferred_language: "English", // or ISO code like 'en'
        base_currency: "USD"
      }]).select().single();
      user = newUser;
    }

    let userLanguage = user.preferred_language || "English";
    let userCurrency = user.base_currency || "USD";

    // Dynamic Language Change via WhatsApp command (e.g. "lang:es" or "lang:French" or "lang:si")
    if (body.toLowerCase().startsWith("lang:") || body.toLowerCase().startsWith("language:")) {
      const selectedLang = body.split(":")[1].trim();
      await supabase.from("users").update({ preferred_language: selectedLang }).eq("phone_number", from);
      
      const successMsg = await generateGPTResponse(
        `Inform the user that their preferred language has been updated to "${selectedLang}".`,
        selectedLang
      );
      await sendWhatsAppMessage(from, successMsg);
      return NextResponse.json({ success: true });
    }

    // 2. Interactive Button Actions (Confirm / Edit)
    if (body === "Confirm_Transaction") {
      return await handleConfirmation(from, userLanguage, userCurrency);
    }
    if (body === "Edit_Transaction") {
      const editPrompt = await generateGPTResponse(
        "Politely ask the user to type the correct amount and category for the transaction.",
        userLanguage
      );
      await sendWhatsAppMessage(from, editPrompt);
      return NextResponse.json({ success: true });
    }

    // 3. DASHBOARD LINK COMMAND ("link", "dashboard", "login")
    if (["link", "dashboard", "login"].includes(body.toLowerCase())) {
      const magicToken = Buffer.from(`${from}-${Date.now()}`).toString("base64");
      const dashboardUrl = `https://app.broo.ai/auth/verify?token=${magicToken}`;
      const msgText = await generateGPTResponse(
        `Provide web dashboard link: ${dashboardUrl}. Mention that the link is valid for 15 minutes.`,
        userLanguage
      );
      await sendWhatsAppMessage(from, msgText);
      return NextResponse.json({ success: true });
    }

    // 4. VOICE NOTE INPUT (OpenAI Whisper Speech-to-Text + GPT-4o-mini Global Parser)
    if (numMedia > 0 && mediaType.startsWith("audio/")) {
      const audioBuffer = await fetch(mediaUrl).then((res) => res.arrayBuffer());
      const file = new File([audioBuffer], "voice.ogg", { type: mediaType });

      // Step A: Speech to Text via Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
      });

      // Step B: Extract Transaction with GPT-4o-mini
      const parsed = await parseTextWithGPT(transcription.text, userLanguage, userCurrency);
      
      await savePendingTransaction(from, parsed);
      await sendInteractiveButtons(from, parsed, userLanguage);
      return NextResponse.json({ success: true });
    }

    // 5. RECEIPT OCR INPUT (Gemini 1.5 Flash)
    if (numMedia > 0 && mediaType.startsWith("image/")) {
      const imageBuffer = await fetch(mediaUrl).then((res) => res.arrayBuffer());
      const base64Image = Buffer.from(imageBuffer).toString("base64");

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Analyze this receipt image from anywhere in the world. 
                      Extract the total amount, expense category, and ISO 4217 currency code.
                      Respond ONLY in valid JSON format:
                      {"amount": number, "category": string, "currency": string}`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType: mediaType } },
      ]);

      const cleanedJson = result.response.text().replace(/```json|```/g, "").trim();
      const rawParsed = JSON.parse(cleanedJson);

      const parsed: ParsedTransaction = {
        amount: rawParsed.amount,
        category: rawParsed.category,
        currency: rawParsed.currency || userCurrency,
        language: userLanguage
      };

      await savePendingTransaction(from, parsed);
      await sendInteractiveButtons(from, parsed, userLanguage);
      return NextResponse.json({ success: true });
    }

    // 6. TEXT-BASED EXPENSES (Direct Instant Save)
    if (body.length > 0) {
      const parsed = await parseTextWithGPT(body, userLanguage, userCurrency);

      const txCurrency = parsed.currency || userCurrency;

      await supabase.from("expenses").insert([{
        phone_number: from,
        amount: parsed.amount,
        category: parsed.category,
        currency: txCurrency,
        description: body,
      }]);

      const confirmationMsg = await generateGPTResponse(
        `Expense saved successfully: Amount ${txCurrency} ${parsed.amount.toFixed(2)} under category "${parsed.category}".`,
        userLanguage
      );

      await sendWhatsAppMessage(from, confirmationMsg);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Global Webhook Error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// --- HELPER FUNCTIONS ---

// 1. Generate Localized Response in Target Language via GPT-4o-mini
async function generateGPTResponse(instructionContext: string, userLanguage: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a universal WhatsApp financial assistant supporting all global languages (e.g. English, Sinhala, Singlish, Tamil, Hindi, Spanish, French, Arabic, Chinese, Portuguese, Russian, German, Japanese, Korean, etc.).
                  STRICT RULE: Always generate your response strictly in the language "${userLanguage}". 
                  Keep the tone polite, clear, concise, and beautifully formatted for WhatsApp.`
      },
      { role: "user", content: instructionContext }
    ]
  });
  return response.choices[0].message.content || instructionContext;
}

// 2. Parse User Input Text/Voice via GPT-4o-mini
async function parseTextWithGPT(input: string, userLanguage: string, defaultCurrency: string): Promise<ParsedTransaction> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a global AI financial parser.
                  The user's preferred language is "${userLanguage}".
                  Extract:
                  - "amount": numerical value
                  - "category": expense category translated into "${userLanguage}"
                  - "currency": ISO currency code (default to "${defaultCurrency}" if not explicitly mentioned)
                  
                  Respond strictly in JSON format ONLY:
                  {"amount": number, "category": string, "currency": string, "language": "${userLanguage}"}`
      },
      { role: "user", content: input }
    ]
  });
  return JSON.parse(response.choices[0].message.content || "{}");
}

async function savePendingTransaction(phone: string, data: ParsedTransaction) {
  await supabase.from("pending_transactions").insert([{
    phone_number: phone,
    amount: data.amount,
    category: data.category,
    currency: data.currency,
    description: "Receipt/Voice Upload",
    status: "pending"
  }]);
}

async function sendInteractiveButtons(to: string, data: ParsedTransaction, userLanguage: string) {
  const bodyText = await generateGPTResponse(
    `Found transaction: ${data.currency} ${data.amount} for category "${data.category}". Please ask the user to confirm or edit.`,
    userLanguage
  );

  await twilioClient.messages.create({
    from: TWILIO_WHATSAPP_NUMBER,
    to: to,
    body: bodyText,
  });
}

async function handleConfirmation(phone: string, userLanguage: string, fallbackCurrency: string) {
  const { data: pending } = await supabase.from("pending_transactions")
    .select("*").eq("phone_number", phone).eq("status", "pending")
    .order("created_at", { ascending: false }).limit(1).single();

  if (pending) {
    const txCurrency = pending.currency || fallbackCurrency;

    await supabase.from("expenses").insert([{
      phone_number: phone,
      amount: pending.amount,
      category: pending.category,
      currency: txCurrency,
      description: pending.description
    }]);

    await supabase.from("pending_transactions").update({ status: "confirmed" }).eq("id", pending.id);

    const successMessage = await generateGPTResponse(
      `Transaction confirmed and saved: ${txCurrency} ${pending.amount} for "${pending.category}".`,
      userLanguage
    );

    await sendWhatsAppMessage(phone, successMessage);
  }
  return NextResponse.json({ success: true });
}

async function sendWhatsAppMessage(to: string, body: string) {
  await twilioClient.messages.create({
    from: TWILIO_WHATSAPP_NUMBER,
    to: to,
    body: body
  });
}