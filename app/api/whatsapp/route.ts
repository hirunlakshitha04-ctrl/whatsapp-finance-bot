// app/api/whatsapp/route.ts
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

interface OnboardingData {
  name?: string;
  country?: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

// AI Engine: Text Parser
async function extractTransaction(text: string, nativeCurrency: string): Promise<ExtractedData | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a financial parsing core. Analyze text (multilingual: English, Sinhalese, Singlish).
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

// DB Handler: Transaction Comfirmation
async function handleConfirmTransaction(phoneNumber: string, userProfile: any): Promise<string> {
  try {
    const { data: session } = await supabase
      .from('user_sessions')
      .select('pending_transaction')
      .eq('phone_number', phoneNumber)
      .single();

    if (!session?.pending_transaction) {
      return "⚠️ මචං, Confirm කරන්න කිසිම ගනුදෙනුවක් හම්බවුණේ නැහැ! 🧐";
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

    // Session එක reset කර යූසර්ව Active මට්ටමේ තැබීම
    await supabase
      .from('user_sessions')
      .update({ pending_transaction: null, step: 'ACTIVE' })
      .eq('phone_number', phoneNumber);
    
    return `✅ සිරාවටම සේව් කරගත්තා ${userProfile.name} මචං!\n\n🔹 *${tx.item}* (${tx.category})\n💰 *${tx.currency} ${tx.amount}*`;
  } catch (err) {
    console.error("❌ DB Insert Error:", err);
    return "🚨 අප්පට සිරි, ඩේටාබේස් එකට සේව් වෙද්දී පොඩි අවුලක් ගියා මචං!";
  }
}

// MAIN WEBHOOK ROUTER
export async function POST(req: NextRequest) {
  try {
    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID!;
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
    
    const formData = await req.formData();
    const rawFrom = formData.get("From") as string; // 'whatsapp:+94771234567'
    const rawTo = formData.get("To") as string;
    const mediaUrl = formData.get("MediaUrl0") as string | null;
    const mediaContentType = (formData.get("MediaContentType0") as string) || "";
    const body = ((formData.get("Body") as string) || "").trim();

    const from = rawFrom.replace("whatsapp:", "");
    const to = rawTo;
    const normalizedBody = body.toLowerCase();

    // 1. යූසර් සහ එයාගේ වර්තමාන ස්ටෙප් එක DB එකෙන් ලබාගැනීම
    const { data: userProfile } = await supabase.from('users').select('*').eq('phone_number', from).maybeSingle();
    const { data: sessionState } = await supabase.from('user_sessions').select('*').eq('phone_number', from).maybeSingle();

    // ==========================================
    // PHASE A: ONBOARDING FUNNEL (අලුත් යූසර් කෙනෙක් නම්)
    // ==========================================
    if (!userProfile) {
      // ස්ටෙප් A0: වෙබ් එකෙන් නැතිව ඩිරෙක්ට් මැසේජ් එකක් දැමූ විට
      if (!sessionState) {
        await supabase.from('user_sessions').insert({ phone_number: from, step: 'PENDING_NAME' });
        await twilioClient.messages.create({ 
          from: `whatsapp:${to}`, to: `whatsapp:${from}`, 
          body: "👋 Welcome to Global Expense Tracker! ලෙජරය ඇක්ටිව් කරන්න කලින් ප්‍රශ්න 3කට උත්තර දෙන්න මචං.\n\nඔයාගේ සම්පූර්ණ නම (Name) මොකක්ද?" 
        });
        return new NextResponse("OK", { status: 200 });
      }

      // ස්ටෙප් A1: නම ලැබුණු පසු රට විමසීම
      if (sessionState.step === 'PENDING_NAME') {
        await supabase.from('user_sessions').update({ 
          step: 'PENDING_COUNTRY', 
          onboarding_data: { name: body } 
        }).eq('phone_number', from);

        await twilioClient.messages.create({ 
          from: `whatsapp:${to}`, to: `whatsapp:${from}`, 
          body: `නියමයි *${body}*! 🌍 ඔයා දැනට ජීවත් වෙන රට (Country) මොකක්ද?` 
        });
        return new NextResponse("OK", { status: 200 });
      }

      // ස්ටෙප් A2: රට ලැබුණු පසු Currency එක විමසීම
      if (sessionState.step === 'PENDING_COUNTRY') {
        const currentData = (sessionState.onboarding_data as OnboardingData) || {};
        const onboardingData = { ...currentData, country: body };
        
        await supabase.from('user_sessions').update({ 
          step: 'PENDING_CURRENCY', 
          onboarding_data: onboardingData 
        }).eq('phone_number', from);

        await twilioClient.messages.create({ 
          from: `whatsapp:${to}`, to: `whatsapp:${from}`, 
          body: "එළකිරි! අවසාන වශයෙන් ඔයා පාවිච්චි කරන මුදල් වර්ගයේ කෝඩ් එක එවන්න මචං. (උදා: LKR, USD, EUR, AED)" 
        });
        return new NextResponse("OK", { status: 200 });
      }

      // ස්ටෙප් A3: Currency එක ලැබුණු පසු Confirm/Edit කිරීම
      if (sessionState.step === 'PENDING_CURRENCY') {
        const baseProfile = (sessionState.onboarding_data as OnboardingData) || {};
        
        if (normalizedBody.includes('edit')) {
          await supabase.from('user_sessions').update({ step: 'PENDING_NAME', onboarding_data: {} }).eq('phone_number', from);
          await twilioClient.messages.create({ 
            from: `whatsapp:${to}`, to: `whatsapp:${from}`, 
            body: "හරි මචං, අපි මුල ඉඳන් පටන් ගමු. ඔයාගේ නම එවන්න." 
          });
          return new NextResponse("OK", { status: 200 });
        }

        if (normalizedBody.includes('confirm')) {
          const finalCurrency = (sessionState.pending_transaction as any)?.currency || 'USD';
          
          // ස්ථිරවම යූසර්ව රෙජිස්ටර් කිරීම
          await supabase.from('users').insert({
            phone_number: from,
            name: baseProfile.name!,
            country: baseProfile.country!,
            currency: finalCurrency
          });

          await supabase.from('user_sessions').update({ step: 'ACTIVE', pending_transaction: null, onboarding_data: null }).eq('phone_number', from);
          
          await twilioClient.messages.create({ 
            from: `whatsapp:${to}`, to: `whatsapp:${from}`, 
            body: `🚀 සුපිරි මචං! ඔයාගේ Global Expense Account එක සාර්ථකව ඇක්ටිව් වුණා.\n\nදැන් ඔයාට පුළුවන් "කෑම වලට 450", "ගෑස් බිල 3200" වගේ මැසේජ් දාලා හෝ බිල්පත් වල ෆොටෝ දාලා වියදම් සටහන් කරන්න.` 
          });
          return new NextResponse("OK", { status: 200 });
        }

        // තොරතුරු නිවැරදිද කියා පෙන්වන Preview මැසේජ් එක
        const currencyCode = body.toUpperCase().replace(/[^A-Z]/g, '');
        await supabase.from('user_sessions').update({ pending_transaction: { currency: currencyCode } }).eq('phone_number', from);
        
        await twilioClient.messages.create({
          from: `whatsapp:${to}`, to: `whatsapp:${from}`,
          body: `🔍 ඔයාගේ විස්තර ටික මෙන්න මචං:\n\n👤 නම: *${baseProfile.name}*\n🌍 රට: *${baseProfile.country}*\n💱 Currency: *${currencyCode}*\n\nසියල්ල නිවැරදි නම් *Confirm* කියලත්, වෙනස් කරන්න ඕනේ නම් *Edit* කියලත් එවන්න.`
        });
        return new NextResponse("OK", { status: 200 });
      }
      return new NextResponse("OK", { status: 200 });
    }

    // ==========================================
    // PHASE B: ACTIVE USER TRANSACTION LOGIC
    // ==========================================
    const userCurrency = userProfile.currency || "USD";

    if (normalizedBody === "confirm") {
      const respMessage = await handleConfirmTransaction(from, userProfile);
      await twilioClient.messages.create({ from: `whatsapp:${to}`, to: `whatsapp:${from}`, body: respMessage });
      return new NextResponse("OK", { status: 200 });
    }

    if (normalizedBody === "edit") {
      await supabase.from('user_sessions').update({ pending_transaction: null }).eq('phone_number', from);
      await twilioClient.messages.create({ from: `whatsapp:${to}`, to: `whatsapp:${from}`, body: "හරි මචං, වැරදුණු තැන හදලා නිවැරදි විස්තරය ආයෙත් එවන්න." });
      return new NextResponse("OK", { status: 200 });
    }

    let extractedTx: ExtractedData | null = null;

    if (mediaUrl && mediaContentType.startsWith("image/")) {
      await twilioClient.messages.create({ from: `whatsapp:${to}`, to: `whatsapp:${from}`, body: "📸 මචං, මම ඔයා එවපු බිල්පත කියවමින් ඉන්නේ. තත්පරයක් දෙන්න... ⏳" });
      extractedTx = await extractFromImage(mediaUrl, mediaContentType, TWILIO_SID, TWILIO_TOKEN, userCurrency);
    } else if (body) {
      extractedTx = await extractTransaction(body, userCurrency);
    }

    if (extractedTx && extractedTx.amount) {
      // තහවුරු කරන තෙක් තාවකාලිකව Session එකේ තැබීම
      await supabase.from('user_sessions').update({ pending_transaction: extractedTx }).eq('phone_number', from);
      
      let details = `📝 විස්තරය: *${extractedTx.item}*\n🗂️ කාණ්ඩය: *${extractedTx.category}*\n💰 ගාණ: *${extractedTx.currency} ${extractedTx.amount}*\n\n`;
      details += `-> හරිනම් *Confirm* කියලා reply කරපන්.\n-> වැරදියි නම් *Edit* කියලා reply කරපන්.`;
      
      await twilioClient.messages.create({ from: `whatsapp:${to}`, to: `whatsapp:${from}`, body: details });
    } else {
      await twilioClient.messages.create({ from: `whatsapp:${to}`, to: `whatsapp:${from}`, body: "මට ඒක පැහැදිලිව අඳුරගන්න බැරි වුණා මචං. 'බස් එකට 200ක් ගියා' වගේ එකක් එවන්න, නැතහොත් බිල්පතක photo එකක් දාන්න. 🚀" });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Fatal Webhook Error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}