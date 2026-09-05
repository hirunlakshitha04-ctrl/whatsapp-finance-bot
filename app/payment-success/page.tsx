"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Phone,
  Bot,
  ArrowRight,
  Loader2,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";

// Same plan-id -> display-name mapping used on the pricing/register pages.
const PLAN_LABELS: Record<string, string> = {
  free: "BRO LITE",
  lite: "BRO LITE",
  core: "BRO CORE",
  max: "BRO MAX",
};

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  // These come from the redirect_url we handed Lemon Squeezy at checkout
  // time (see /api/create-checkout), which echoes back the same channel,
  // plan, phone, link_token and already_linked flag the user submitted /
  // that create-checkout resolved on the register page.
  const channel = (searchParams.get("channel") === "telegram" ? "telegram" : "whatsapp") as
    | "whatsapp"
    | "telegram";
  const plan = (searchParams.get("plan") || "core").toLowerCase();
  const linkToken = searchParams.get("link_token") || searchParams.get("token") || "";

  // Set by /api/create-checkout for the upgrade flow: true when this user's
  // channel was already linked before checkout. In that case the webhook
  // (see sendUpgradeConfirmation in /api/lemon-webhook) already pushed the
  // "🎉 Upgraded!" message straight into their existing chat — so this page
  // just needs to confirm, not redirect/link them anywhere.
  const alreadyLinked = searchParams.get("already_linked") === "true";

  const planLabel = PLAN_LABELS[plan] || "BroFinAi";
  const isTelegram = channel === "telegram";

  const destinationUrl = (() => {
    if (isTelegram) {
      const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "your_bot_username";
      return `https://t.me/${botUsername}${linkToken ? `?start=${linkToken}` : ""}`;
    }
    // Same env var the Twilio client/webhook route already use
    // (NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER) — its value looks like
    // "whatsapp:+14155238886", so strip both the "whatsapp:" prefix and the
    // "+" before building the wa.me link, which wants bare digits.
    const rawBotNumber =
      process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
    const botPhoneNumber = rawBotNumber.replace("whatsapp:", "");

    if (linkToken) {
      // New registration OR a different-channel upgrade that still needs
      // linking — the WhatsApp route greps the body for this exact
      // "START-<token>" pattern to resolve it.
      return `https://wa.me/${botPhoneNumber.replace("+", "")}?text=${encodeURIComponent(`START-${linkToken}`)}`;
    }

    if (alreadyLinked) {
      // Already-linked upgrade: the webhook already pushed the "🎉
      // Upgraded!" confirmation into this chat directly, so there's nothing
      // for the user to send — open the chat with no pre-filled text at
      // all. (A pre-filled message would get sent as a real incoming
      // message and run through the bot's transaction-extraction pipeline,
      // which doesn't know what to do with it.)
      return `https://wa.me/${botPhoneNumber.replace("+", "")}`;
    }

    // Fallback: no token, not already linked (shouldn't normally happen,
    // but keep a harmless greeting rather than nothing).
    const text = `Hi BroFinAi, I just registered to the ${planLabel} plan!`;
    return `https://wa.me/${botPhoneNumber.replace("+", "")}?text=${encodeURIComponent(text)}`;
  })();

  const theme = isTelegram
    ? {
        borderGradient: "linear-gradient(135deg, #38bdf8, #22d3ee)",
        glow: "shadow-[0_0_60px_0_rgba(56,189,248,0.25)]",
        badgeBg: "bg-sky-500/15 border-sky-400 text-sky-300",
        buttonClass:
          "bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950",
        icon: <Bot className="w-5 h-5" />,
        channelName: "Telegram",
        // Page background — same deep blue as the landing page's hero
        // section, so this page reads as a continuation of that channel.
        pageBg: "from-blue-500 via-blue-800 to-slate-950",
        glowTop: "bg-blue-400/30",
        glowBottom: "bg-sky-300/20",
      }
    : {
        borderGradient: "linear-gradient(135deg, #34d399, #22d3ee)",
        glow: "shadow-[0_0_60px_0_rgba(52,211,153,0.25)]",
        badgeBg: "bg-emerald-500/15 border-emerald-400 text-emerald-300",
        buttonClass:
          "bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950",
        icon: <Phone className="w-5 h-5" />,
        channelName: "WhatsApp",
        // Page background — same deep emerald as the landing page's hero
        // section, so this page reads as a continuation of that channel.
        pageBg: "from-emerald-500 via-emerald-800 to-emerald-950",
        glowTop: "bg-emerald-400/30",
        glowBottom: "bg-teal-300/20",
      };

  return (
    <>
      {/* Page background — recolored to the active channel (deep emerald for
          WhatsApp, deep blue for Telegram) instead of a fixed dark backdrop,
          so this page continues the same color story as the landing/register
          pages instead of switching to an unrelated purple/pink/cyan look. */}
      <div className={`fixed inset-0 -z-10 bg-gradient-to-br ${theme.pageBg} pointer-events-none`}>
        <div className={`absolute top-[-25%] left-[-5%] w-[620px] h-[620px] rounded-full blur-[160px] pointer-events-none ${theme.glowTop}`} />
        <div className={`absolute bottom-[-30%] right-[0%] w-[560px] h-[560px] rounded-full blur-[160px] pointer-events-none ${theme.glowBottom}`} />
      </div>

      <div className="w-full max-w-md relative z-10">

      {/* Speech-bubble Card — same shape language as the rest of the site:
          gradient border layer + glass fill layer + a small fixed-size tail
          (doesn't scale with card height, unlike the earlier SVG-mask
          version), tinted to the active channel's color. */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
        className="relative"
      >
        <div
          aria-hidden
          className="absolute inset-0 rounded-[32px]"
          style={{ background: theme.borderGradient }}
        />
        <div
          aria-hidden
          className="absolute inset-[2px] rounded-[30px] bg-slate-900/80 backdrop-blur-2xl"
        />
        <div
          aria-hidden
          className="absolute w-[26px] h-[26px] rounded-[6px] rotate-45"
          style={{ right: "-11px", bottom: "56px", background: theme.borderGradient }}
        />
        <div
          aria-hidden
          className="absolute w-[22px] h-[22px] rounded-[5px] rotate-45 bg-slate-900"
          style={{ right: "-9px", bottom: "58px" }}
        />

        <div className={`relative p-8 md:p-10 text-center ${theme.glow}`}>

      {/* Success check */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
        className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-400/60 flex items-center justify-center mb-6"
      >
        <CheckCircle2 className="w-9 h-9 text-emerald-400" />
      </motion.div>

      <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
        Payment successful
      </h1>
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium mb-4 ${theme.badgeBg}`}
      >
        You're on {planLabel}
      </div>

      {alreadyLinked ? (
        // already_linked=true: no redirect step needed — the webhook already
        // sent the upgrade confirmation into this user's existing chat.
        <>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            You're all set. We've sent a confirmation straight to your{" "}
            {theme.channelName} chat — nothing else to do here.
          </p>

          <a
            href={destinationUrl}
            className="w-full py-3 px-4 rounded-xl text-center text-sm font-semibold transition flex items-center justify-center gap-2 border border-white/10 text-slate-300 hover:bg-white/5"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Open {theme.channelName} chat</span>
          </a>
        </>
      ) : (
        // already_linked=false (new user / unlinked channel): needs the
        // link_token round-trip, so require an explicit tap instead of an
        // auto-redirect.
        <>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            One last step — tap below to open {theme.channelName} and start
            chatting with BroFinAi.
          </p>

          <a
            href={destinationUrl}
            className={`w-full py-3.5 px-4 rounded-xl text-center text-sm font-semibold transition flex items-center justify-center gap-2 ${theme.buttonClass}`}
          >
            {theme.icon}
            <span>Continue on {theme.channelName}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </>
      )}

      <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Your subscription is active — cancel anytime from the dashboard.</span>
      </div>
        </div>
      </motion.div>
      </div>
    </>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-sans">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-white text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <span>Confirming your payment...</span>
          </div>
        }
      >
        <PaymentSuccessContent />
      </Suspense>
    </main>
  );
}