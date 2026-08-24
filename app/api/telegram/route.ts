import { NextRequest, NextResponse } from "next/server";
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

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const TELEGRAM_FILE_API = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}`;

// Telegram rows are keyed by telegram_chat_id (add this column to
// users / user_sessions / transactions / budgets / monthly_usage —
// same tables the WhatsApp route already uses, just a different key column)
const ID_COLUMN = "telegram_chat_id" as const;

// NOTE: Telegram intentionally does NOT track limit_hits_this_week —
// that counter drives the paid-upgrade nudge cron, and Telegram users
// are being given free/unnudged usage by design. WhatsApp route.ts is
// the only place recordLimitHit() should be called.

// ---------------------- Telegram-specific send/receive helpers ----------------------

async function sendTelegramMessage(chatId: string | number, text: string) {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown", // Telegram legacy Markdown — *bold* matches the WhatsApp templates as-is
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`❌ Telegram sendMessage failed [${res.status}] chatId=${chatId}:`, errBody);

      // Legacy "Markdown" parse_mode is strict about unmatched/nested entities
      // (unescaped _ * [ ] ( ) ` in the text will 400 with "can't parse entities").
      // Retry once as plain text so the user still gets *a* reply instead of nothing.
      if (res.status === 400 && errBody.includes("can't parse entities")) {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }), // no parse_mode
        });
      }
    }
  } catch (err) {
    console.error(`❌ Telegram sendMessage network error chatId=${chatId}:`, err);
  }
}

// Resolve a Telegram file_id -> a downloadable Buffer
async function downloadTelegramFile(fileId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const fileInfoRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
    const fileInfo = await fileInfoRes.json();
    const filePath = fileInfo?.result?.file_path;
    if (!filePath) return null;

    const fileRes = await fetch(`${TELEGRAM_FILE_API}/${filePath}`);
    const arrayBuffer = await fileRes.arrayBuffer();

    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const mimeType =
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "png" ? "image/png" : ext === "oga" || ext === "ogg" ? "audio/ogg" : "application/octet-stream";

    return { buffer: Buffer.from(arrayBuffer), mimeType };
  } catch (err) {
    console.error("❌ Telegram File Download Error:", err);
    return null;
  }
}

// MAIN WEBHOOK ROUTER — Telegram
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update?.message;
    if (!message) {
      // Ignore non-message updates (edited_message, callback_query, etc.)
      return new NextResponse("OK", { status: 200 });
    }

    const chatId: number = message.chat.id;
    const from = String(chatId);
    const body = (message.text || message.caption || "").trim();
    const normalizedBody = body.toLowerCase();

    // Telegram gives an array of PhotoSize thumbnails — largest is last
    const photoSizes = message.photo as Array<{ file_id: string }> | undefined;
    const photoFileId = photoSizes && photoSizes.length > 0 ? photoSizes[photoSizes.length - 1].file_id : null;
    const voiceFileId: string | null = message.voice?.file_id || null;

    const isImage = !!photoFileId;
    const isAudio = !!voiceFileId;

    const send = (text: string) => sendTelegramMessage(chatId, text);

    // 0️⃣ ACCOUNT LINKING — "/start <token>" deep link from the website
    // (Free register page's "Start on Telegram" button AND the Telegram
    // payment-success page both link to https://t.me/<bot>?start=<token>.
    // Telegram turns that into a "/start <token>" message automatically.)
    if (normalizedBody.startsWith("/start")) {
      const linkToken = body.split(" ")[1]?.trim();
      const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://brofinai.com";

      if (!linkToken) {
        // Plain "/start" with no token — user opened the bot directly, not via a link
        await send(getRegisterMessage(websiteUrl));
        return new NextResponse("OK", { status: 200 });
      }

      // Find the pending row created at registration/payment time
      const { data: pendingUser } = await supabase
        .from("users")
        .select("*")
        .eq("link_token", linkToken)
        .is(ID_COLUMN, null)
        .maybeSingle();

      if (!pendingUser) {
        // Token already used, expired, or never existed
        await send(`⚠️ *Link Invalid or Expired*\n\nThis link isn't valid anymore. Please go back to the website and tap "Start on Telegram" again to get a fresh link.`);
        return new NextResponse("OK", { status: 200 });
      }

      const { error: linkErr } = await supabase
        .from("users")
        .update({ [ID_COLUMN]: from, link_token: null })
        .eq("id", pendingUser.id);

      if (linkErr) {
        console.error("❌ Telegram Account Link Error:", linkErr);
        await send(`🚨 Something went wrong linking your account. Please try tapping the link again.`);
        return new NextResponse("OK", { status: 200 });
      }

      const linkNickname = pendingUser.how_to_call_you || pendingUser.nickname || pendingUser.name || "Bro";
      const linkedLang = pendingUser.language || pendingUser.preferred_language || "English";
      const linkedCurrency = pendingUser.base_currency || pendingUser.currency || "LKR";

      // Was this account already active on another channel (e.g. registered
      // via WhatsApp, with real transaction history)? If so, they already
      // went through onboarding — don't ask for a starting balance again,
      // just confirm the link. Mirrors the WhatsApp route's same check,
      // keyed on phone_number instead.
      //
      // NOTE: plan alone (CORE/MAX) must NOT be used as a signal here — plan
      // is set at registration time, before payment even completes, so a
      // brand-new Telegram signup on a paid plan would otherwise be wrongly
      // treated as "already active" and get the carry-over message instead
      // of the welcome + starting-balance prompt on their actual first link.
      let hasTransactionHistory = false;
      if (pendingUser.phone_number) {
        const { count } = await supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .eq("phone_number", pendingUser.phone_number);
        hasTransactionHistory = (count || 0) > 0;
      }

      const hasHistory = hasTransactionHistory;

      if (hasHistory) {
        const planLabel = (pendingUser.plan || "lite").toUpperCase();
        // Skip the AWAITING_STARTING_BALANCE step entirely — this user is
        // already active elsewhere, so their very next message should be
        // treated as a normal transaction, not captured as starting capital.
        await supabase
          .from("user_sessions")
          .upsert({ [ID_COLUMN]: from, step: "ACTIVE" }, { onConflict: ID_COLUMN });
        // Telegram becomes this user's active channel — the old channel
        // (e.g. WhatsApp) will now be blocked from logging new transactions.
        await supabase.from("users").update({ active_channel: "telegram" }).eq("id", pendingUser.id);
        await send(
          `✅ *Connected!*\n\nHey ${linkNickname}, Telegram is now linked to Brofinai — your *${planLabel}* plan and full history carry over automatically. 🚀`
        );
      } else {
        // NOTE: requires a UNIQUE constraint on user_sessions.telegram_chat_id
        // for onConflict to work — mirrors the WhatsApp route's identical note.
        await supabase
          .from("user_sessions")
          .upsert({ [ID_COLUMN]: from, step: "AWAITING_STARTING_BALANCE" }, { onConflict: ID_COLUMN });
        await supabase.from("users").update({ active_channel: "telegram" }).eq("id", pendingUser.id);

        const welcomeMsgs = await getLocalizedMessages(linkedLang, linkNickname, linkedCurrency, websiteUrl);
        await send(welcomeMsgs.welcome);
      }

      return new NextResponse("OK", { status: 200 });
    }

    // 1️⃣ Fetch User Profile
    let { data: userProfile } = await supabase.from("users").select("*").eq(ID_COLUMN, from).maybeSingle();

    if (!userProfile) {
      const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://brofinai.com";
      await send(getRegisterMessage(websiteUrl));
      return new NextResponse("OK", { status: 200 });
    }

    // ---------------- SINGLE ACTIVE CHANNEL ENFORCEMENT ----------------
    // If this user switched their active channel to WhatsApp (via an
    // upgrade or a fresh channel link), block further use of Telegram
    // entirely rather than letting transactions fragment across channels.
    // Mirrors the WhatsApp route's identical check.
    if (userProfile.active_channel && userProfile.active_channel !== "telegram") {
      const rawBotNumber = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
      const waNumber = rawBotNumber.replace("whatsapp:", "");
      await send(
        `👋 Looks like your account is now active on WhatsApp! Please continue chatting with BroFinAi there:\nhttps://wa.me/${waNumber.replace("+", "")}`
      );
      return new NextResponse("OK", { status: 200 });
    }

    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://brofinai.com";
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
        await send(getExcelLockedMessage(nickname, websiteUrl));
        return new NextResponse("OK", { status: 200 });
      }
      // Logic for Core & Max users to send Excel File...
    }

    // 2️⃣ PLAN CHECKS & FEATURE LIMITATIONS
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
            user_id: userProfile.id,
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

    if (isImage && photoFileId) {
      const file = await downloadTelegramFile(photoFileId);
      if (file) {
        const base64Image = file.buffer.toString("base64");
        extractedTx = await extractFromImageBuffer(base64Image, file.mimeType, userCurrency, userLang, nickname);
      }
    } else if (isAudio && voiceFileId) {
      const langInfo = getWhisperLanguageInfo(userLang);
      const file = await downloadTelegramFile(voiceFileId);

      if (!file) {
        await send(baseMsgs.fallback);
        return new NextResponse("OK", { status: 200 });
      }

      const transcriptionResult = await transcribeVoiceBuffer(file.buffer, "voice.ogg", file.mimeType, langInfo?.isoCode || null);

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
    } else if (body) {
      extractedTx = await extractTransaction(body, userCurrency, userLang, nickname);
    }

    // 8️⃣ TEXT -> SAVE DIRECTLY | VOICE / IMAGE -> SEND PREVIEW FOR CONFIRM/EDIT
    if (extractedTx && extractedTx.amount) {
      if (!isImage && !isAudio) {
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
    console.error("❌ Fatal Telegram Webhook Error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}

// Telegram calls setWebhook once to point at this URL — no console config like Twilio.
// Run once (locally or via a script) after deploying:
//
// curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://yoursite.com/api/telegram"