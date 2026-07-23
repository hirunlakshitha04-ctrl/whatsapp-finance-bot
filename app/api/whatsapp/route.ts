import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { OpenAI } from "openai";
import { supabase } from "@/lib/supabase"; 
import twilio from "twilio";

// Types Definition
interface ExtractedData {
  action: "log_transaction" | "set_budget";
  type: "expense" | "income" | "loan_given" | "loan_taken" | "loan_settled" | null;
  item: string;
  category: string;
  amount: number;
  person: string | null;
  currency: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

// AI Engine: Text Parser
async function extractTransaction(text: string, nativeCurrency: string, language: string): Promise<ExtractedData | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a financial parsing core. Analyze text (multilingual: English, Sinhalese, Arabic, Singlish, etc. Preference lang: ${language}).
Determine action: 'log_transaction' OR 'set_budget'.
Match exactly one Category: [Food, Transport, Bills, Shopping, Entertainment, Medical, Education, Salary, Loan, Other].

LOAN LOGIC:
1. Gave money / Lent ➔ type: 'loan_given'. Extract person name.
2. Borrowed / Took ➔ type: 'loan_taken'. Extract person name.
3. Repaid / Settled ➔ type: 'loan_settled'. Extract person name.

Response MUST be pure JSON format matching this schema:
{
  "action": "log_transaction" | "set_budget",
  "type": "expense" | "income" | "loan_given" | "loan_taken" | "loan_settled" | null,
  "item": "clear description string",
  "category": "String",
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

// AI Engine: Vision Image Bill/Receipt Parser
async function extractFromImage(
  mediaUrl: string, 
  contentType: string, 
  twilioSid: string, 
  twilioToken: string, 
  nativeCurrency: string
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
          content: `Extract financial values from this bill receipt image. Default currency is ${nativeCurrency}. Output JSON:
{
  "action": "log_transaction",
  "type": "expense",
  "item": "Merchant/Store Name",
  "category": "Food" | "Transport" | "Bills" | "Shopping" | "Entertainment" | "Medical" | "Education" | "Salary" | "Loan" | "Other",
  "amount": number,
  "person": null,
  "currency": "${nativeCurrency}"
}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Parse the exact total cost, merchant name, and logical category mapping." },
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

// DB Handler: Transaction Confirmation
async function handleConfirmTransaction(phoneNumber: string, userProfile: any): Promise<string> {
  try {
    const { data: session } = await supabase
      .from('user_sessions')
      .select('pending_transaction')
      .eq('phone_number', phoneNumber)
      .single();

    if (!session?.pending_transaction) {
      return userProfile.language === "si" 
        ? "⚠️ Confirm කරන්න කිසිම ගනුදෙනුවක් හම්බවුණේ නැහැ!"
        : "⚠️ No pending transaction found to confirm!";
    }

    const tx = session.pending_transaction as ExtractedData;
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

    // Reset session state back to ACTIVE
    await supabase
      .from('user_sessions')
      .update({ pending_transaction: null, step: 'ACTIVE' })
      .eq('phone_number', phoneNumber);
    
    const nickname = userProfile.nickname || userProfile.name || "Friend";

    if (userProfile.language === "si") {
      return `✅ සිරාවටම සේව් කරගත්තා ${nickname}!\n\n🔹 *${tx.item}* (${tx.category})\n💰 *${tx.currency} ${tx.amount}*`;
    } else {
      return `✅ Saved successfully, ${nickname}!\n\n🔹 *${tx.item}* (${tx.category})\n💰 *${tx.currency} ${tx.amount}*`;
    }
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
    const rawTo = formData.get("To") as string;     
    const mediaUrl = formData.get("MediaUrl0") as string | null;
    const mediaContentType = (formData.get("MediaContentType0") as string) || "";
    const body = ((formData.get("Body") as string) || "").trim();

    // Clean Phone Numbers
    const from = rawFrom.replace("whatsapp:", "");
    const to = rawTo.replace("whatsapp:", "");
    const normalizedBody = body.toLowerCase();

    // 1. Fetch User Profile from Supabase (Populated via Web Registration Form)
    const { data: userProfile } = await supabase.from('users').select('*').eq('phone_number', from).maybeSingle();

    // ==========================================
    // UNREGISTERED USER FLOW
    // ==========================================
    if (!userProfile) {
      const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";
      const registerMsg = `👋 Welcome to Global Expense Tracker!\n\n` +
        `You are not registered yet. Please complete your profile on our website first:\n\n` +
        `👉 ${websiteUrl}/register\n\n` +
        `Once registered, send a message here to start tracking! 🚀`;

      await twilioClient.messages.create({
        from: `whatsapp:${to}`,
        to: `whatsapp:${from}`,
        body: registerMsg,
      });

      return new NextResponse("OK", { status: 200 });
    }

    // ==========================================
    // REGISTERED USER - SESSION VERIFICATION
    // ==========================================
    const { data: sessionState } = await supabase.from('user_sessions').select('*').eq('phone_number', from).maybeSingle();

    // First Message after Web Registration
    if (!sessionState) {
      await supabase.from('user_sessions').insert({ phone_number: from, step: 'ACTIVE' });

      const nickname = userProfile.nickname || userProfile.name || "Friend";
      const currency = userProfile.currency || "USD";
      const userLang = userProfile.language || "en";

      let welcomeMsg = "";
      if (userLang === "si") {
        welcomeMsg = `👋 ආයුබෝවන් ${nickname}!\n\n` +
          `ඔබගේ Global Expense Tracker ගිණුම සක්‍රීයයි! (${currency})\n\n` +
          `💡 **වියදම් ලොග් කරන්නේ මෙහෙමයි:**\n` +
          `• "කෑම වලට 450"\n` +
          `• "Spent 15 USD for lunch"\n` +
          `• නැතහොත් ඕනෑම බිල්පතක ඡායාරූපයක් (Bill Photo) මෙතැනට එවන්න!\n\n` +
          `ලොග් කරන්න අවශ්‍ය වියදම දැන්ම ටයිප් කර එවන්න. 🚀`;
      } else {
        welcomeMsg = `👋 Welcome ${nickname}!\n\n` +
          `Your Global Expense Tracker account is fully active in **${currency}**!\n\n` +
          `💡 **How to log expenses:**\n` +
          `• "Food 15 ${currency}"\n` +
          `• "Spent 50 on Petrol"\n` +
          `• Or simply send a photo of any receipt/bill!\n\n` +
          `Send your first expense now to start tracking! 🚀`;
      }

      await twilioClient.messages.create({
        from: `whatsapp:${to}`,
        to: `whatsapp:${from}`,
        body: welcomeMsg,
      });

      return new NextResponse("OK", { status: 200 });
    }

    // ==========================================
    // ACTIVE USER TRANSACTION LOGIC
    // ==========================================
    const userCurrency = userProfile.currency || "USD";
    const userLang = userProfile.language || "en";

    // Handle Transaction Confirmation / Cancel
    if (normalizedBody === "confirm") {
      const respMessage = await handleConfirmTransaction(from, userProfile);
      await twilioClient.messages.create({ from: `whatsapp:${to}`, to: `whatsapp:${from}`, body: respMessage });
      return new NextResponse("OK", { status: 200 });
    }

    if (normalizedBody === "edit") {
      await supabase.from('user_sessions').update({ pending_transaction: null }).eq('phone_number', from);
      const cancelMsg = userLang === "si" 
        ? "හරි මචං, වැරදුණු තැන හදලා නිවැරදි විස්තරය ආයෙත් එවන්න."
        : "No problem! Please re-send the correct expense details.";
      await twilioClient.messages.create({ from: `whatsapp:${to}`, to: `whatsapp:${from}`, body: cancelMsg });
      return new NextResponse("OK", { status: 200 });
    }

    // AI Expense Extraction
    let extractedTx: ExtractedData | null = null;

    if (mediaUrl && mediaContentType.startsWith("image/")) {
      const scanningMsg = userLang === "si" 
        ? "📸 මචං, මම ඔයා එවපු බිල්පත කියවමින් ඉන්නේ. තත්පරයක් දෙන්න... ⏳"
        : "📸 Scanning your receipt... Please wait a moment ⏳";
      await twilioClient.messages.create({ from: `whatsapp:${to}`, to: `whatsapp:${from}`, body: scanningMsg });
      
      extractedTx = await extractFromImage(mediaUrl, mediaContentType, TWILIO_SID, TWILIO_TOKEN, userCurrency);
    } else if (body) {
      extractedTx = await extractTransaction(body, userCurrency, userLang);
    }

    // Confirmation Preview Prompt
    if (extractedTx && extractedTx.amount) {
      await supabase.from('user_sessions').update({ pending_transaction: extractedTx }).eq('phone_number', from);
      
      let details = "";
      if (userLang === "si") {
        details = `📝 විස්තරය: *${extractedTx.item}*\n🗂️ කාණ්ඩය: *${extractedTx.category}*\n💰 ගාණ: *${extractedTx.currency} ${extractedTx.amount}*\n\n` +
          `-> හරිනම් *Confirm* කියලා reply කරපන්.\n-> වැරදියි නම් *Edit* කියලා reply කරපන්.`;
      } else {
        details = `📝 Item: *${extractedTx.item}*\n🗂️ Category: *${extractedTx.category}*\n💰 Amount: *${extractedTx.currency} ${extractedTx.amount}*\n\n` +
          `-> Reply *Confirm* to save.\n-> Reply *Edit* to change.`;
      }
      
      await twilioClient.messages.create({ from: `whatsapp:${to}`, to: `whatsapp:${from}`, body: details });
    } else {
      const fallbackMsg = userLang === "si"
        ? "මට ඒක පැහැදිලිව අඳුරගන්න බැරි වුණා මචං. 'බස් එකට 200ක් ගියා' වගේ එකක් එවන්න, නැතහොත් බිල්පතක photo එකක් දාන්න. 🚀"
        : "I couldn't clearly parse that. Try something like 'Spent 20 on Lunch' or send a photo of a receipt. 🚀";
      await twilioClient.messages.create({ from: `whatsapp:${to}`, to: `whatsapp:${from}`, body: fallbackMsg });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Fatal Webhook Error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}