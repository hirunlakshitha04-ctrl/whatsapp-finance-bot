"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Phone,
  Bot,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";

// Same plan-id -> display-name mapping used on the pricing/register pages.
const PLAN_LABELS: Record<string, string> = {
  free: "BRO LITE",
  lite: "BRO LITE",
  core: "BRO CORE",
  max: "BRO MAX",
};

const AUTO_REDIRECT_SECONDS = 3;

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  // These come from the redirect_url we handed Lemon Squeezy at checkout
  // time (see /api/create-checkout), which echoes back the same channel,
  // plan, phone and link_token the user submitted on the register page.
  const channel = (searchParams.get("channel") === "telegram" ? "telegram" : "whatsapp") as
    | "whatsapp"
    | "telegram";
  const plan = (searchParams.get("plan") || "core").toLowerCase();
  const phone = searchParams.get("phone") || "";
  const linkToken = searchParams.get("link_token") || searchParams.get("token") || "";
  const planLabel = PLAN_LABELS[plan] || "BroFinAi";

  const isTelegram = channel === "telegram";

  const destinationUrl = (() => {
    if (isTelegram) {
      const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "your_bot_username";
      return `https://t.me/${botUsername}${linkToken ? `?start=${linkToken}` : ""}`;
    }
    const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "+14155238886";
    const defaultText = encodeURIComponent(
      `Hi BroFinAi, I just registered to the ${planLabel} plan!`
    );
    return `https://wa.me/${botPhoneNumber.replace("+", "")}?text=${defaultText}`;
  })();

  const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS);
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setRedirected(true);
      window.location.href = destinationUrl;
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const theme = isTelegram
    ? {
        ring: "border-sky-400/60",
        glow: "shadow-[0_0_60px_0_rgba(56,189,248,0.25)]",
        badgeBg: "bg-sky-500/15 border-sky-400 text-sky-300",
        buttonClass:
          "bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950",
        icon: <Bot className="w-5 h-5" />,
        channelName: "Telegram",
      }
    : {
        ring: "border-emerald-400/60",
        glow: "shadow-[0_0_60px_0_rgba(52,211,153,0.25)]",
        badgeBg: "bg-emerald-500/15 border-emerald-400 text-emerald-300",
        buttonClass:
          "bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950",
        icon: <Phone className="w-5 h-5" />,
        channelName: "WhatsApp",
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
      className={`relative w-full max-w-md rounded-3xl p-8 md:p-10 bg-slate-900/70 backdrop-blur-xl border ${theme.ring} ${theme.glow} text-center`}
    >
      {/* Success check */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
        className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-400/60 flex items-center justify-center mb-6"
      >
        <CheckCircle2 className="w-9 h-9 text-emerald-400" />
      </motion.div>

      <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
        Payment Successful 🎉
      </h1>
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider mb-4 ${theme.badgeBg}`}
      >
        You're on {planLabel}
      </div>

      <p className="text-slate-400 text-sm leading-relaxed mb-8">
        {redirected ? (
          <>Opening {theme.channelName}…</>
        ) : (
          <>
            Taking you to {theme.channelName} in{" "}
            <span className="text-white font-semibold">{secondsLeft}s</span> to start
            chatting with BroFinAi. Didn't move? Tap below.
          </>
        )}
      </p>

      <a
        href={destinationUrl}
        className={`w-full py-3.5 px-4 rounded-xl text-center text-sm tracking-wide font-bold transition flex items-center justify-center gap-2 ${theme.buttonClass}`}
      >
        {theme.icon}
        <span>Start on {theme.channelName}</span>
        <ArrowRight className="w-4 h-4" />
      </a>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Your subscription is active — cancel anytime from the dashboard.</span>
      </div>
    </motion.div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 bg-[#07090e] overflow-hidden font-sans">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-pink-600/25 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-600/20 rounded-full blur-[130px] pointer-events-none" />

      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-white text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            <span>Confirming your payment...</span>
          </div>
        }
      >
        <PaymentSuccessContent />
      </Suspense>
    </main>
  );
}