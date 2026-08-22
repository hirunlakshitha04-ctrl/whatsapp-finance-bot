"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Phone,
  Bot,
  ArrowRight,
  Loader2,
  ShieldCheck,
  MessageCircle,
  DollarSign,
  Wallet,
  Coins,
  TrendingUp,
  Receipt,
  CreditCard,
  PieChart,
} from "lucide-react";

// Same plan-id -> display-name mapping used on the pricing/register pages.
const PLAN_LABELS: Record<string, string> = {
  free: "BRO LITE",
  lite: "BRO LITE",
  core: "BRO CORE",
  max: "BRO MAX",
};

// Falling finance-icon background — same decorative effect used on the
// landing page, dashboard, and pricing page. Dollar signs, wallets, coins
// etc. drop in inside circular badges and settle at a spot spread across the
// full height of the screen, each on its own staggered delay/cycle, then
// fade back out and repeat. Presets are hardcoded (not Math.random) so
// server-rendered and client-hydrated markup match exactly.
const FALLING_ICON_SET = [DollarSign, Wallet, Coins, TrendingUp, Receipt, CreditCard, PieChart];

const FALLING_ICON_PRESETS: {
  icon: number;
  left: number;
  circleSize: number;
  iconSize: number;
  cycleDuration: number;
  delay: number;
  landY: string;
}[] = [
  { icon: 6, left: 2, circleSize: 58, iconSize: 25, cycleDuration: 14.8, delay: 6, landY: "87vh" },
  { icon: 0, left: 5, circleSize: 56, iconSize: 23, cycleDuration: 14.9, delay: 9.5, landY: "72vh" },
  { icon: 6, left: 9, circleSize: 42, iconSize: 18, cycleDuration: 15.7, delay: 1.6, landY: "25vh" },
  { icon: 3, left: 9, circleSize: 55, iconSize: 21, cycleDuration: 13.4, delay: 7.6, landY: "50vh" },
  { icon: 3, left: 15, circleSize: 62, iconSize: 26, cycleDuration: 10.4, delay: 8.8, landY: "20vh" },
  { icon: 1, left: 16, circleSize: 45, iconSize: 17, cycleDuration: 16.8, delay: 1.9, landY: "71vh" },
  { icon: 4, left: 23, circleSize: 55, iconSize: 21, cycleDuration: 9.5, delay: 4.2, landY: "34vh" },
  { icon: 5, left: 26, circleSize: 51, iconSize: 20, cycleDuration: 16.5, delay: 6.1, landY: "40vh" },
  { icon: 2, left: 27, circleSize: 59, iconSize: 25, cycleDuration: 15.1, delay: 9.8, landY: "55vh" },
  { icon: 3, left: 31, circleSize: 54, iconSize: 23, cycleDuration: 10.5, delay: 4.9, landY: "35vh" },
  { icon: 0, left: 31, circleSize: 48, iconSize: 19, cycleDuration: 16.7, delay: 0.6, landY: "47vh" },
  { icon: 2, left: 36, circleSize: 53, iconSize: 21, cycleDuration: 9.8, delay: 4.7, landY: "50vh" },
  { icon: 5, left: 39, circleSize: 52, iconSize: 22, cycleDuration: 15.7, delay: 9, landY: "44vh" },
  { icon: 0, left: 41, circleSize: 51, iconSize: 22, cycleDuration: 10.1, delay: 1.5, landY: "34vh" },
  { icon: 0, left: 49, circleSize: 52, iconSize: 23, cycleDuration: 16.3, delay: 5.7, landY: "49vh" },
  { icon: 3, left: 52, circleSize: 45, iconSize: 19, cycleDuration: 16.5, delay: 5.5, landY: "55vh" },
  { icon: 5, left: 51, circleSize: 57, iconSize: 24, cycleDuration: 12.2, delay: 8, landY: "73vh" },
  { icon: 3, left: 58, circleSize: 55, iconSize: 22, cycleDuration: 9.8, delay: 1.9, landY: "46vh" },
  { icon: 3, left: 58, circleSize: 57, iconSize: 22, cycleDuration: 12.1, delay: 3.7, landY: "61vh" },
  { icon: 1, left: 65, circleSize: 39, iconSize: 16, cycleDuration: 14.2, delay: 9.1, landY: "80vh" },
  { icon: 4, left: 64, circleSize: 57, iconSize: 25, cycleDuration: 13.8, delay: 2.6, landY: "34vh" },
  { icon: 5, left: 68, circleSize: 60, iconSize: 26, cycleDuration: 9.9, delay: 2.7, landY: "56vh" },
  { icon: 1, left: 72, circleSize: 45, iconSize: 19, cycleDuration: 15.6, delay: 4.1, landY: "46vh" },
  { icon: 1, left: 79, circleSize: 59, iconSize: 26, cycleDuration: 11.5, delay: 6.8, landY: "86vh" },
  { icon: 1, left: 83, circleSize: 53, iconSize: 21, cycleDuration: 9.3, delay: 1.6, landY: "33vh" },
  { icon: 4, left: 82, circleSize: 49, iconSize: 21, cycleDuration: 15.6, delay: 2.1, landY: "45vh" },
  { icon: 1, left: 88, circleSize: 56, iconSize: 24, cycleDuration: 10.4, delay: 3.8, landY: "35vh" },
  { icon: 5, left: 88, circleSize: 59, iconSize: 26, cycleDuration: 9.5, delay: 9.7, landY: "66vh" },
  { icon: 2, left: 96, circleSize: 48, iconSize: 21, cycleDuration: 13.6, delay: 2.3, landY: "71vh" },
  { icon: 4, left: 99, circleSize: 48, iconSize: 22, cycleDuration: 9.6, delay: 2.8, landY: "36vh" },
];

function FallingIcons() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden>
      {FALLING_ICON_PRESETS.map((p, i) => {
        const Icon = FALLING_ICON_SET[p.icon];
        // Small per-item variety so the fall doesn't look like a rigid straight
        // drop — a touch of sideways drift and rotation that reverses direction
        // based on index, plus a landing bounce that eases into a smooth,
        // bounce-free fade.
        const drift = (i % 2 === 0 ? 1 : -1) * (6 + (p.circleSize % 5));
        const spin = (i % 2 === 0 ? 1 : -1) * (8 + (p.iconSize % 6));

        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: `${p.left}%`, top: "-14%" }}
            initial={{ y: "-10vh", x: 0, opacity: 0, scale: 0.4, rotate: 0 }}
            animate={{
              y: ["-10vh", p.landY, p.landY, "-8vh"],
              x: [0, drift, drift, 0],
              opacity: [0, 1, 1, 0],
              scale: [0.4, 1, 1, 0.5],
              rotate: [0, spin, spin, spin * 1.4],
            }}
            transition={{
              duration: p.cycleDuration,
              delay: p.delay,
              repeat: Infinity,
              times: [0, 0.18, 0.82, 1], // quick fall in, long hold, gentle fade out
              ease: [
                [0.34, 1.56, 0.64, 1], // fall-in: slight overshoot, like settling on landing
                "easeInOut",           // hold: values are static here, so this segment is inert
                [0.4, 0, 0.2, 1],      // fade-out: smooth ease, no bounce
              ],
            }}
          >
            <div
              className="rounded-full bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white/30"
              style={{ width: p.circleSize, height: p.circleSize }}
            >
              <Icon style={{ width: p.iconSize, height: p.iconSize }} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

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
      }
    : {
        borderGradient: "linear-gradient(135deg, #34d399, #22d3ee)",
        glow: "shadow-[0_0_60px_0_rgba(52,211,153,0.25)]",
        badgeBg: "bg-emerald-500/15 border-emerald-400 text-emerald-300",
        buttonClass:
          "bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950",
        icon: <Phone className="w-5 h-5" />,
        channelName: "WhatsApp",
      };

  return (
    <div className="w-full max-w-md relative z-10">

      {/* Site Logo — same mark used across the rest of the site */}
      <Link
        href="/"
        className="flex items-center justify-center gap-2.5 font-bold text-xl tracking-tight mb-8 hover:opacity-90 transition"
      >
        <img src="/logo-icon.png" alt="BroFInAi logo" className="w-9 h-9 object-contain" />
        <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Bro<span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">FInAi</span>
        </span>
      </Link>

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

      <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
        Payment Successful 🎉
      </h1>
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider mb-4 ${theme.badgeBg}`}
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
            className="w-full py-3 px-4 rounded-xl text-center text-sm tracking-wide font-semibold transition flex items-center justify-center gap-2 border border-white/10 text-slate-300 hover:bg-white/5"
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
            className={`w-full py-3.5 px-4 rounded-xl text-center text-sm tracking-wide font-bold transition flex items-center justify-center gap-2 ${theme.buttonClass}`}
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
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 bg-[#07090e] overflow-hidden font-sans">
      {/* Background layer — pinned at z-0, strictly below the card's own
          "relative z-10" wrapper. FallingIcons' own div uses -z-10
          internally, which would sit BEHIND this element's own background
          paint if rendered as a direct child — wrapping it (and the glow
          blobs) at z-0 guarantees they render above the page background but
          below the card. */}
      <div className="fixed inset-0 -z-0 pointer-events-none">
        <FallingIcons />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/30 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-pink-600/25 rounded-full blur-[160px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-600/20 rounded-full blur-[130px]" />
      </div>

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