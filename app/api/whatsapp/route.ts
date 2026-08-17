import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import twilio from "twilio";
import { supabase } from "@/lib/supabase";
import { checkAndResetDailyLimits } from "@/lib/resetLimits";
import {
  ExtractedData,
  getLocalizedMessages,
  getWhisperLanguageInfo,
  extractTransaction,
  extractFromImageBuffer,
  transcribeVoiceBuffer,
  saveExtractedDirect,
  handleConfirmTransaction,
  getRegisterMessage,
  getLinkMessage,
  getExcelLockedMessage,
} from "@/lib/finance-logic";

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const TWILIO_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "whatsapp:+94764775963";

// WhatsApp rows are keyed by phone_number
const ID_COLUMN = "phone_number" as const;

// MAIN WEBHOOK ROUTER — WhatsApp (Twilio)
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

    const send = (text: string) =>
      twilioClient.messages.create({ from: TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${from}`, body: text });

    // 0️⃣ ACCOUNT LINKING — "START-<token>" arrives from a paid-checkout
    // success redirect, OR from an existing user (e.g. already registered on
    // Telegram) who is adding WhatsApp as a second channel via the dashboard's
    // "Connect WhatsApp" button. Either way, this attaches `from` to an
    // EXISTING user row instead of treating them as brand new.
    if (body.toUpperCase().startsWith("START-")) {
      const linkToken = body.split("-").slice(1).join("-").trim();
      const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";

      if (!linkToken) {
        await send(getRegisterMessage(websiteUrl));
        return new NextResponse("OK", { status: 200 });
      }

      const { data: tokenUser } = await supabase
        .from("users")
        .select("*")
        .eq("link_token", linkToken)
        .maybeSingle();

      if (!tokenUser) {
        // Token doesn't exist / already used / expired
        await send(`⚠️ This link has expired or was already used. Please go back to the website and try again:\n👉 ${websiteUrl}/register`);
        return new NextResponse("OK", { status: 200 });
      }

      // Was this account already active on another channel (e.g. registered
      // via Telegram)? If so, they already went through onboarding — don't
      // ask for a starting balance again, just confirm the link.
      //
      // Two signals count as "already active": an actual transaction history
      // on the other channel, OR a paid plan already set (covers the case
      // where a Core/Max user links a second channel before logging their
      // first transaction there — they've still been through onboarding).
      const isPaidPlan = !!tokenUser.plan && tokenUser.plan.toLowerCase() !== "lite";

      let hasTransactionHistory = false;
      if (tokenUser.telegram_chat_id) {
        const { count } = await supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("telegram_chat_id", tokenUser.telegram_chat_id);
        hasTransactionHistory = (count || 0) > 0;
      }

      const hasHistory = isPaidPlan || hasTransactionHistory;

      // Attach this WhatsApp number to the existing user row and burn the token.
      await supabase.from("users").update({ phone_number: from, link_token: null }).eq("id", tokenUser.id);

      const linkedLang = tokenUser.language || tokenUser.preferred_language || "English";
      const linkedNickname = tokenUser.how_to_call_you || tokenUser.nickname || tokenUser.name || "Bro";
      const linkedCurrency = tokenUser.base_currency || tokenUser.currency || "LKR";

      if (hasHistory) {
        const planLabel = (tokenUser.plan || "lite").toUpperCase();
        // Skip the AWAITING_STARTING_BALANCE step entirely — this user is
        // already active elsewhere, so their very next message should be
        // treated as a normal transaction, not captured as starting capital.
        await supabase
          .from("user_sessions")
          .upsert({ phone_number: from, step: "ACTIVE" }, { onConflict: "phone_number" });
        await send(
          `🎉 Connected! Hey ${linkedNickname}, WhatsApp is now linked to Brofinai — your *${planLabel}* plan and full history carry over automatically. 🚀`
        );
      } else {
        // NOTE: requires a UNIQUE constraint on user_sessions.phone_number
        // for onConflict to work (see migration note below).
        await supabase
          .from("user_sessions")
          .upsert({ phone_number: from, step: "AWAITING_STARTING_BALANCE" }, { onConflict: "phone_number" });

        const welcomeMsgs = await getLocalizedMessages(linkedLang, linkedNickname, linkedCurrency, websiteUrl);
        await send(welcomeMsgs.welcome);
      }

      return new NextResponse("OK", { status: 200 });
    }

    // 1️⃣ Fetch User Profile
    let { data: userProfile } = await supabase.from("users").select("*").eq(ID_COLUMN, from).maybeSingle();

    if (!userProfile) {
      const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";
      await send(getRegisterMessage(websiteUrl));
      return new NextResponse("OK", { status: 200 });
    }

    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";
    const userLang = userProfile.language || userProfile.preferred_language || "English";
    const nickname = userProfile.how_to_call_you || userProfile.nickname || userProfile.name || "Bro";
    const userCurrency = userProfile.base_currency || userProfile.currency || "LKR";
    const userPlan = (userProfile.plan || "lite").toLowerCase();

    await checkAndResetDailyLimits(userProfile);

    // ---------------- LINK / LOGIN COMMAND CHECK ----------------
    if (["LINK", "LOGIN", "DASHBOARD", "WEBSITE"].includes(body.toUpperCase())) {
      await send(getLinkMessage(nickname, websiteUrl));
      return new NextResponse("OK", { status: 200 });
    }

    // ---------------- EXCEL / BUDGET COMMAND CHECK ----------------
    if (body.toUpperCase() === "EXCEL" || body.toUpperCase() === "BUDGET") {
      if (userPlan === "lite") {
        await send(getExcelLockedMessage(nickname));
        return new NextResponse("OK", { status: 200 });
      }
      // Logic for Core & Max users to send Excel File...
    }

    // 2️⃣ PLAN CHECKS & FEATURE LIMITATIONS
    const isImage = !!mediaUrl && mediaContentType.startsWith("image/");
    const isAudio = !!mediaUrl && mediaContentType.startsWith("audio/");

    const baseMsgs = await getLocalizedMessages(userLang, nickname, userCurrency, websiteUrl);

    // 🛑 1. DAILY TRANSACTION LIMIT CHECK (TEXT ONLY — image/voice have their own checks below)
    const currentDailyTx = userProfile.daily_tx_count || 0;
    if (!isImage && !isAudio && !normalizedBody.includes("registered") && normalizedBody !== "confirm" && normalizedBody !== "edit") {
      if (userPlan === "lite" && currentDailyTx >= 3) {
        await send(baseMsgs.dailyTxLimitReached);
        return new NextResponse("OK", { status: 200 });
      }
      if (userPlan === "core" && currentDailyTx >= 10) {
        await send(baseMsgs.dailyTxLimitReached);
        return new NextResponse("OK", { status: 200 });
      }
    }

    // 🛑 2. OCR / IMAGE SCAN LIMIT CHECKS
    if (isImage) {
      const dailyOcr = userProfile.daily_ocr_count || 0;

      if (userPlan === "lite" && dailyOcr >= 1) {
        await send(baseMsgs.dailyOcrLimitReached);
        return new NextResponse("OK", { status: 200 });
      }

      if (userPlan === "core") {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: usage } = await supabase
          .from("monthly_usage")
          .select("scan_count")
          .eq(ID_COLUMN, from)
          .eq("month_year", currentMonth)
          .maybeSingle();

        const currentScanCount = usage?.scan_count || 0;

        if (currentScanCount >= 30) {
          await send(baseMsgs.limitReached);
          return new NextResponse("OK", { status: 200 });
        }

        await supabase.from("monthly_usage").upsert(
          { [ID_COLUMN]: from, month_year: currentMonth, scan_count: currentScanCount + 1 },
          { onConflict: `${ID_COLUMN}, month_year` }
        );
      }

      await supabase.from("users").update({ daily_ocr_count: dailyOcr + 1 }).eq(ID_COLUMN, from);
    }

    // 🛑 3. VOICE NOTE LIMIT CHECKS
    if (isAudio) {
      if (userPlan === "lite") {
        await send(baseMsgs.proFeatureVoice);
        return new NextResponse("OK", { status: 200 });
      }
      if (userPlan === "core") {
        const dailyVoice = userProfile.daily_voice_count || 0;
        if (dailyVoice >= 5) {
          await send(baseMsgs.dailyVoiceLimitReached);
          return new NextResponse("OK", { status: 200 });
        }
        await supabase.from("users").update({ daily_voice_count: dailyVoice + 1 }).eq(ID_COLUMN, from);
      }
    }

    // 3️⃣ SESSION VERIFICATION & FETCHING
    let { data: sessionState } = await supabase.from("user_sessions").select("*").eq(ID_COLUMN, from).maybeSingle();

    if (!sessionState) {
      const { data: newSession } = await supabase
        .from("user_sessions")
        .insert({ [ID_COLUMN]: from, step: "AWAITING_STARTING_BALANCE" })
        .select()
        .single();
      sessionState = newSession;
    }

    // 4️⃣ FIRST-TIME REGISTRATION REDIRECT MESSAGE
    if (normalizedBody.includes("registered") || normalizedBody.includes("hi broo")) {
      await supabase.from("user_sessions").update({ step: "AWAITING_STARTING_BALANCE" }).eq(ID_COLUMN, from);
      await send(baseMsgs.welcome);
      return new NextResponse("OK", { status: 200 });
    }

    // 5️⃣ STEP: AWAITING STARTING BALANCE
    if (sessionState?.step === "AWAITING_STARTING_BALANCE") {
      const extracted = await extractTransaction(body, userCurrency, userLang, nickname);

      if (extracted && extracted.amount) {
        await supabase.from("transactions").insert([
          {
            [ID_COLUMN]: from,
            type: "income",
            item: "Starting Capital",
            category: "Savings/Investments",
            amount: extracted.amount,
            currency: userCurrency,
          },
        ]);

        await supabase.from("user_sessions").update({ step: "ACTIVE" }).eq(ID_COLUMN, from);

        const formattedAmountStr = Number(extracted.amount).toLocaleString();
        const guideMsgs = await getLocalizedMessages(userLang, nickname, userCurrency, websiteUrl, { amount: formattedAmountStr });

        await send(guideMsgs.guidelines);
        return new NextResponse("OK", { status: 200 });
      }
    }

    // 6️⃣ CONFIRM / EDIT HANDLERS
    if (normalizedBody === "confirm" || normalizedBody === "potwierdź" || normalizedBody === "yes" || normalizedBody === "confirmar") {
      const respMessage = await handleConfirmTransaction(ID_COLUMN, from, userProfile, userLang, nickname, userCurrency, websiteUrl);
      await send(respMessage);
      return new NextResponse("OK", { status: 200 });
    }

    if (normalizedBody === "edit" || normalizedBody === "edytuj" || normalizedBody === "editar") {
      await supabase.from("user_sessions").update({ pending_transaction: null }).eq(ID_COLUMN, from);
      await send(baseMsgs.editCancel);
      return new NextResponse("OK", { status: 200 });
    }

    // 7️⃣ EXTRACTION ENGINE (IMAGE / VOICE / TEXT)
    let extractedTx: ExtractedData | null = null;

    if (mediaUrl) {
      if (isImage) {
        const mediaRes = await axios.get(mediaUrl, {
          responseType: "arraybuffer",
          auth: { username: TWILIO_SID, password: TWILIO_TOKEN },
          timeout: 15000,
        });
        const base64Image = Buffer.from(mediaRes.data).toString("base64");
        extractedTx = await extractFromImageBuffer(base64Image, mediaContentType, userCurrency, userLang, nickname);
      } else if (isAudio) {
        const langInfo = getWhisperLanguageInfo(userLang);

        const mediaRes = await axios.get(mediaUrl, {
          responseType: "arraybuffer",
          auth: { username: TWILIO_SID, password: TWILIO_TOKEN },
          timeout: 15000,
        });
        const audioBuffer = Buffer.from(mediaRes.data);
        const transcriptionResult = await transcribeVoiceBuffer(audioBuffer, "voice.ogg", "audio/ogg", langInfo?.isoCode || null);

        if (!transcriptionResult || !transcriptionResult.text) {
          await send(baseMsgs.fallback);
          return new NextResponse("OK", { status: 200 });
        }

        // Skipped for "Singlish" (langInfo is null) since it's code-switched mixed speech.
        if (langInfo && transcriptionResult.detectedLanguage && transcriptionResult.detectedLanguage !== langInfo.name) {
          const mismatchMsgs = await getLocalizedMessages(userLang, nickname, userCurrency, websiteUrl, { language: langInfo.name });
          await send(mismatchMsgs.voiceLangMismatch);
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
        const directMsg = await saveExtractedDirect(ID_COLUMN, from, userProfile, extractedTx, userLang, nickname, userCurrency, websiteUrl);
        await send(directMsg);
        return new NextResponse("OK", { status: 200 });
      }

      // VOICE / IMAGE input: always show a preview and require Confirm/Edit
      await supabase.from("user_sessions").update({ pending_transaction: extractedTx }).eq(ID_COLUMN, from);

      const formattedNumber = Number(extractedTx.amount).toLocaleString();
      const typeTag = extractedTx.action === "set_budget" ? "🎯 Budget" : extractedTx.type === "income" ? baseMsgs.typeIncome : baseMsgs.typeExpense;

      const previewMsgs = await getLocalizedMessages(userLang, nickname, userCurrency, websiteUrl, {
        item: extractedTx.action === "set_budget" ? "Monthly Budget" : extractedTx.item,
        typeTag,
        category: extractedTx.category,
        amount: formattedNumber,
      });

      await send(previewMsgs.preview);
    } else {
      await send(baseMsgs.fallback);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Fatal WhatsApp Webhook Error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}