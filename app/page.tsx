"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, Variants } from "framer-motion";
import {
  ArrowUpRight,
  Zap,
  ShieldCheck,
  Receipt,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  PieChart,
  Check,
  X,
  Activity,
  Mail,
  Phone,
  Send,
  Tag,
  Mic,
} from "lucide-react";

// Lucide dropped trademarked brand icons (Twitter/X, Instagram, LinkedIn, Facebook),
// so these are small local SVG replacements kept in the same stroke style.
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="0" />
    <path
      d="M18.9 3H21.7L15.3 10.3 22.8 21H16.9L12.3 14.7 7 21H4.2L11 13.2 3.8 3H9.9L14.1 8.8 18.9 3Z"
      fill="currentColor"
    />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.83v1.98h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.14V23h-4v-6.65c0-1.59-.03-3.63-2.21-3.63-2.22 0-2.56 1.73-2.56 3.52V23h-4V8.5z" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13.5 22v-8.4h2.8l.4-3.3h-3.2V8.1c0-.95.27-1.6 1.63-1.6H17V3.5C16.68 3.46 15.58 3.36 14.3 3.36c-2.6 0-4.4 1.6-4.4 4.53v2.4H7.1v3.3h2.8V22h3.6z" />
  </svg>
);

// Brand marks for the two supported chat channels. Drawn in the same filled
// style as the social icons above so they sit naturally in the same rows.
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.68 1.47 5.27L2 22l4.94-1.56a9.9 9.9 0 0 0 5.1 1.4h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.02c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.12.08-1.8-.11a13.8 13.8 0 0 1-2-.71 11.05 11.05 0 0 1-4.36-3.86c-.42-.58-.85-1.26-.95-1.98-.1-.7.06-1.28.5-1.72.19-.19.42-.29.66-.29h.47c.16 0 .37-.03.55.42l.78 1.9c.06.16.1.28.02.44-.08.16-.13.26-.26.4l-.36.42c-.11.13-.23.27-.1.5.14.24.62 1.03 1.34 1.67.92.83 1.7 1.09 1.94 1.21.24.13.38.11.53-.06l.55-.63c.2-.24.38-.2.62-.11l1.71.81c.24.11.4.16.46.26.06.11.06.63-.18 1.3Z" />
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21.5 3.5 2.7 10.9c-1.2.5-1.2 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.2-2.1 4.6 3.4c.8.5 1.4.2 1.6-.8l3-14.1c.3-1.2-.4-1.7-1.3-1.3Zm-3.9 3.5-7.7 6.9-.3 3.1-1.5-4.6 8.6-6.1c.4-.3.8.1.4.4Z" />
  </svg>
);

// ---------------------------------------------------------------------------
// Channel system — the whole page is aware of which chat app the visitor is
// picturing themselves in. One switcher (nav) drives the hero, the live
// mockup, the "how it works" copy, and pricing, so WhatsApp and Telegram
// read as genuinely equal front doors into the product, not WhatsApp-first
// with Telegram bolted on.
// ---------------------------------------------------------------------------
type Channel = "whatsapp" | "telegram";

const CHANNEL_META: Record<
  Channel,
  {
    label: string;
    icon: React.FC<{ className?: string }>;
    from: string;
    via: string;
    to: string;
    text: string;
    dot: string;
    ring: string;
    glow: string;
    handle: string;
    badge: string;
    connectTitle: string;
    connectDesc: string;
    exampleMessage: string;
  }
> = {
  whatsapp: {
    label: "WhatsApp",
    icon: WhatsAppIcon,
    from: "from-emerald-400",
    via: "via-teal-300",
    to: "to-cyan-400",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    ring: "border-emerald-400/60",
    glow: "shadow-emerald-500/25",
    handle: "+ 94 71 636 3235",
    badge: "Live now on WhatsApp",
    connectTitle: "Save the WhatsApp Number",
    connectDesc: "Save our WhatsApp business number and send \"Hi\" to instantly link your account.",
    exampleMessage: "Spent $45.50 on Coffee & Breakfast ☕",
  },
  telegram: {
    label: "Telegram",
    icon: TelegramIcon,
    from: "from-sky-400",
    via: "via-blue-300",
    to: "to-cyan-400",
    text: "text-sky-400",
    dot: "bg-sky-400",
    ring: "border-sky-400/60",
    glow: "shadow-sky-500/25",
    handle: "@BroFInAi_Bot",
    badge: "Live now on Telegram",
    connectTitle: "Start the Telegram Bot",
    connectDesc: "Search @BroFInAi_Bot on Telegram and hit Start to instantly link your account.",
    exampleMessage: "Spent $45.50 on Coffee & Breakfast ☕",
  },
};

const CHANNELS: Channel[] = ["whatsapp", "telegram"];

// Pricing Plans Data — 3 plans × 2 channels (WhatsApp / Telegram).
// Prices are channel-specific; everything else (features, badge, copy) stays
// constant across channels, so the cards only need to swap the price on toggle.
const PRICING_PLANS = [
  {
    id: "free",
    name: "BRO LITE",
    prices: { whatsapp: "$0.00", telegram: "$0.00" },
    period: "/ month",
    badge: "Free Forever",
    description: "Ideal for basic daily expense tracking.",
    highlight: false,
    buttonText: "GET STARTED FREE",
    buttonClass: "bg-slate-800 hover:bg-slate-700 text-white border border-white/10",
    trialNote: { whatsapp: "7-day free trial", telegram: "Permanent free tier" },
    features: [
      { text: "3 Daily Expense & Income Logs", included: true },
      { text: "Real-time Web Dashboard Access", included: true },
      { text: "1 Daily AI Receipt OCR Scan", included: true },
      { text: "Voice Note Tracking", included: false },
      { text: "One-Click Excel (.xlsx) Export", included: false },
      { text: "Smart Budget Handling & Alerts", included: false },
    ],
  },
  {
    id: "core",
    name: "BRO CORE",
    prices: { whatsapp: "$3.50", telegram: "$2.50" },
    period: "/ month",
    badge: "MOST POPULAR",
    description: "Ideal for active spenders & daily users.",
    highlight: true,
    buttonText: "UPGRADE TO BRO CORE",
    buttonClass: "bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black shadow-lg shadow-emerald-500/20",
    trialNote: null,
    features: [
      { text: "10 Daily Expense & Income Logs", included: true },
      { text: "Real-time Web Dashboard Access", included: true },
      { text: "30 Monthly AI Receipt OCR Scans", included: true },
      { text: "5 Daily Voice Note Trackings", included: true },
      { text: "One-Click Excel (.xlsx) Export", included: true },
      { text: "Smart Budget Handling & Alerts", included: true },
    ],
  },
  {
    id: "max",
    name: "BRO MAX",
    prices: { whatsapp: "$6.99", telegram: "$4.00" },
    period: "/ month",
    badge: "POWER USERS",
    description: "For freelancers, business owners & power users.",
    highlight: false,
    buttonText: "GET BRO MAX",
    buttonClass: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold shadow-lg shadow-purple-500/25",
    trialNote: null,
    features: [
      { text: "Unlimited Daily Expense & Income Logs", included: true },
      { text: "Real-time Web Dashboard Access", included: true },
      { text: "Unlimited Monthly AI Receipt OCR Scans", included: true },
      { text: "Unlimited Voice Note Trackings", included: true },
      { text: "One-Click Excel (.xlsx) Export", included: true },
      { text: "Smart Budget Handling & Alerts", included: true },
    ],
  },
];

// Telegram is cheaper than WhatsApp on every paid plan — this derives the
// exact per-plan savings straight from PRICING_PLANS (never hardcoded), so
// the discount popup always matches whatever the pricing cards show.
const TELEGRAM_SAVINGS = PRICING_PLANS.map((plan) => {
  const wa = parseFloat(plan.prices.whatsapp.replace("$", ""));
  const tg = parseFloat(plan.prices.telegram.replace("$", ""));
  return { name: plan.name, amount: wa - tg };
}).filter((s) => s.amount > 0);

const BEST_TELEGRAM_SAVING = TELEGRAM_SAVINGS.reduce(
  (best, s) => (s.amount > best.amount ? s : best),
  { name: "", amount: 0 }
);

// Full row-by-row feature comparison (collapsible table under the cards).
// Values are either a string (shown as-is) or a boolean (rendered as check/x).
const FEATURE_COMPARISON: {
  label: string;
  free: string | boolean;
  core: string | boolean;
  max: string | boolean;
}[] = [
  { label: "Text transaction logging", free: "3/day", core: "10/day", max: "Unlimited" },
  { label: "Receipt scan (AI vision)", free: "1/day", core: "30/month", max: "Unlimited" },
  { label: "Voice note logging", free: false, core: "5/day", max: "Unlimited" },
  { label: "Budget setting", free: false, core: true, max: true },
  { label: "Excel export", free: false, core: true, max: true },
  { label: "Loan tracking (given/taken/settled)", free: true, core: true, max: true },
  { label: "Multi-language (Sinhala/Singlish/auto-translate)", free: true, core: true, max: true },
  { label: "Web dashboard access", free: true, core: true, max: true },
];

// Reusable, compact channel switcher — this is the page's signature control.
// It appears in the nav and again above pricing, both driving the same
// shared state, so switching once carries the visitor's choice everywhere.
function ChannelSwitch({
  channel,
  onChange,
  layoutId,
  size = "sm",
}: {
  channel: Channel;
  onChange: (c: Channel) => void;
  layoutId: string;
  size?: "sm" | "lg";
}) {
  const isLg = size === "lg";
  return (
    <div className={`relative inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 ${isLg ? "p-1.5" : "p-1"}`}>
      {CHANNELS.map((c) => {
        const meta = CHANNEL_META[c];
        const Icon = meta.icon;
        const active = channel === c;
        return (
          <button
            key={c}
            type="button"
            aria-pressed={active}
            aria-label={`Switch to ${meta.label}`}
            onClick={() => onChange(c)}
            className={`relative z-10 flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider transition-colors ${
              isLg ? "px-6 py-2.5 text-xs" : "px-3 py-1.5 text-[11px]"
            } ${active ? "text-slate-950" : "text-slate-400 hover:text-white"}`}
          >
            {active && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className={`absolute inset-0 rounded-full bg-gradient-to-r ${meta.from} ${meta.to}`}
              />
            )}
            <Icon className={`relative ${isLg ? "w-3.5 h-3.5" : "w-3 h-3"}`} />
            <span className="relative">{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function BroFInAiLandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [showComparison, setShowComparison] = useState(false);
  const [showDiscountToast, setShowDiscountToast] = useState(false);
  const { scrollYProgress } = useScroll();

  const meta = CHANNEL_META[channel];
  const ChannelIcon = meta.icon;

  // Discount popup — fires while the visitor is browsing on WhatsApp, to
  // nudge them toward the cheaper Telegram plans. Hides itself the moment
  // they actually switch to Telegram (nothing left to nudge them into).
  // Savings are calculated live from the same numbers shown on the
  // pricing cards below.
  useEffect(() => {
    if (channel !== "whatsapp") {
      setShowDiscountToast(false);
      return;
    }
    const timer = setTimeout(() => setShowDiscountToast(true), 1200);
    return () => clearTimeout(timer);
  }, [channel]);

  const discountLines = useMemo(
    () => TELEGRAM_SAVINGS.map((s) => `${s.name.replace("BRO ", "")} −$${s.amount.toFixed(2)}/mo`).join("  ·  "),
    []
  );

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.98]);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Hook this up to your API route / email service of choice
    setContactSent(true);
    setContactForm({ name: "", email: "", message: "" });
    setTimeout(() => setContactSent(false), 4000);
  };

  // Smooth Scroll Helper
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, ease: [0.215, 0.610, 0.355, 1.000] },
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white selection:bg-purple-500 selection:text-white font-sans overflow-x-hidden relative pb-28">

      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 z-[100] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Ambient Lights — soft, diffused "aurora" blooms rather than hard
          accent blocks, closer to a cinematic generative-AI canvas than a
          flat SaaS gradient. One bloom now tracks the active channel. */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="fixed top-[35%] right-[-10%] w-[650px] h-[650px] bg-pink-600/15 rounded-full blur-[190px] pointer-events-none -z-10" />
      <motion.div
        animate={{ opacity: 1 }}
        className={`fixed bottom-[-10%] left-[20%] w-[550px] h-[550px] rounded-full blur-[160px] pointer-events-none -z-10 transition-colors duration-700 ${
          channel === "whatsapp" ? "bg-emerald-600/15" : "bg-sky-600/15"
        }`}
      />

      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/70 border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight shrink-0">
            <img src="/logo-icon.png" alt="BroFInAi logo" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent hidden sm:inline">
              Bro<span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">FInAi</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" onClick={(e) => scrollToSection(e, "features")} className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" onClick={(e) => scrollToSection(e, "how-it-works")} className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, "pricing")} className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, "faq")} className="hover:text-white transition-colors">FAQ</a>
            <a href="#contact" onClick={(e) => scrollToSection(e, "contact")} className="hover:text-white transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ChannelSwitch channel={channel} onChange={setChannel} layoutId="nav-channel-pill" />
            <Link href="/login" className="hidden sm:inline text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition whitespace-nowrap">
              Login
            </Link>
            <Link
              href={`/register?plan=free&channel=${channel}&type=direct`}
              className="group relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-xs bg-white text-slate-950 hover:bg-slate-200 transition shadow-lg shadow-white/10 flex items-center gap-1.5 overflow-hidden whitespace-nowrap"
            >
              <span className="hidden sm:inline">Get Started</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* TELEGRAM DISCOUNT POPUP — shows while browsing on WhatsApp to nudge
          toward the cheaper Telegram plans; disappears once they switch. */}
      <AnimatePresence>
        {showDiscountToast && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[90] w-[92%] max-w-md"
          >
            <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-sky-400/40 shadow-2xl shadow-sky-500/20 p-4 sm:p-5">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-transparent to-cyan-400/10 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowDiscountToast(false)}
                aria-label="Dismiss"
                className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="relative flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 pr-4">
                  <p className="text-sm font-bold text-white">
                    Register on Telegram & save 🎉
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Same bot, same features — but up to{" "}
                    <span className="font-bold text-sky-400">${BEST_TELEGRAM_SAVING.amount.toFixed(2)}/mo</span> cheaper on {BEST_TELEGRAM_SAVING.name.replace("BRO ", "")} if you sign up via Telegram instead of WhatsApp.
                  </p>
                  <p className="text-[11px] text-slate-500">{discountLines}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setChannel("telegram");
                      setShowDiscountToast(false);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 transition-colors pt-0.5"
                  >
                    Switch to Telegram pricing <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <motion.section
        style={{ opacity, scale }}
        className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
      >
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          className="lg:col-span-6 space-y-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`badge-${channel}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/15 backdrop-blur-md text-xs font-semibold text-purple-300 shadow-xl shadow-purple-500/10"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{meta.badge}</span>
            </motion.div>
          </AnimatePresence>

          <h1 className="text-5xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[1.08]">
            Master Your Expenses Right Inside{" "}
            <AnimatePresence mode="wait">
              <motion.span
                key={channel}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`inline-block bg-gradient-to-r ${meta.from} ${meta.via} ${meta.to} bg-clip-text text-transparent`}
              >
                {meta.label}
              </motion.span>
            </AnimatePresence>
          </h1>

          <p className="text-slate-400 text-lg max-w-lg font-normal leading-relaxed">
            Zero complex apps. Log unlimited expenses via chat text or auto-scan receipt photos with AI. Instant real-time dashboard tracking — on whichever app you already live in.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href={`/register?plan=free&channel=${channel}&type=direct`}
              className={`px-8 py-4 rounded-full font-bold text-sm bg-gradient-to-r ${meta.from} ${meta.via} ${meta.to} text-slate-950 transition-all shadow-xl ${meta.glow} flex items-center gap-2 group`}
            >
              <span>Start Free on {meta.label} 🚀</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> Unlimited Free Text Logging
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
            <span>Also available on</span>
            <button
              type="button"
              onClick={() => setChannel(channel === "whatsapp" ? "telegram" : "whatsapp")}
              className="inline-flex items-center gap-1.5 font-semibold text-slate-300 hover:text-white transition-colors underline decoration-dotted underline-offset-4"
            >
              {React.createElement(CHANNEL_META[channel === "whatsapp" ? "telegram" : "whatsapp"].icon, { className: "w-3.5 h-3.5" })}
              {CHANNEL_META[channel === "whatsapp" ? "telegram" : "whatsapp"].label}
            </button>
          </div>
        </motion.div>

        {/* Dynamic Chat Mockup — chrome, accent, and the bot's handle swap
            with the active channel so the preview never lies about which
            app it's simulating. */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="lg:col-span-6 relative flex justify-center"
        >
          <div className={`relative w-full max-w-md p-6 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border shadow-2xl space-y-4 transition-colors duration-500 ${meta.ring}`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-slate-400">
                <ChannelIcon className={`w-4 h-4 ${meta.text}`} />
                <span className="text-xs font-mono">{meta.handle}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.span
                  key={`status-${channel}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`text-xs font-mono flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${meta.text} bg-white/5 border-white/10`}
                >
                  <Activity className="w-3 h-3 animate-spin" />
                  BroFInAi Bot Live
                </motion.span>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`chat-${channel}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 font-sans text-xs sm:text-sm pt-2"
              >
                <div
                  className={`p-3 rounded-2xl rounded-tr-none max-w-[85%] ml-auto shadow-md border ${
                    channel === "whatsapp"
                      ? "bg-emerald-600/30 border-emerald-500/30 text-emerald-100"
                      : "bg-sky-600/30 border-sky-500/30 text-sky-100"
                  }`}
                >
                  {meta.exampleMessage}
                </div>
                <div className="bg-slate-800/90 border border-white/10 text-slate-200 p-4 rounded-2xl rounded-tl-none max-w-[90%] space-y-2 shadow-lg">
                  <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${meta.text}`}>
                    <CheckCircle2 className="w-4 h-4" /> Expense Logged!
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1 text-xs">
                    <div className="bg-white/5 p-2 rounded-lg">💵 Amount: <b className="text-white">$45.50</b></div>
                    <div className="bg-white/5 p-2 rounded-lg">🏷️ Category: <b className="text-white">Dining</b></div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.section>

      {/* FEATURES SECTION */}
      <section id="features" className="scroll-mt-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto px-6 py-28 border-t border-white/5"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-purple-400">Core Features</div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Everything You Need to Save More</h2>
            <p className="text-slate-500 text-sm flex items-center justify-center gap-2 pt-1">
              <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
              <span>Identical on WhatsApp and</span>
              <TelegramIcon className="w-4 h-4 text-sky-400" />
              <span>Telegram — pick one, or use both.</span>
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div variants={fadeInUp} className="p-8 rounded-[28px] bg-slate-900/60 border border-white/10 hover:border-emerald-500/50 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl mb-3">💬 Unlimited Chat Logging</h3>
              <p className="text-slate-400 text-sm leading-relaxed">No daily limits! Send a normal WhatsApp or Telegram message anytime to log expenses naturally.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="p-8 rounded-[28px] bg-slate-900/60 border border-white/10 hover:border-orange-500/50 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-6">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl mb-3">🎤 Track by Voice</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Just say what you spent in a voice note — AI transcribes and logs it instantly, no typing needed.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="p-8 rounded-[28px] bg-slate-900/60 border border-white/10 hover:border-purple-500/50 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl mb-3">🧾 AI Receipt OCR Scanner</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Snap photos of receipts. Smart AI extracts merchant name, date, and exact amounts automatically.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="p-8 rounded-[28px] bg-slate-900/60 border border-white/10 hover:border-cyan-500/50 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl mb-3">📊 Dashboard & Excel Export</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Real-time sync with full web dashboard access and one-click structured Excel file downloads.</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-6 py-28 border-t border-white/5"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">Step-by-Step</div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">How It Works</h2>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex justify-center mb-14">
            <ChannelSwitch channel={channel} onChange={setChannel} layoutId="how-it-works-pill" size="lg" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div variants={fadeInUp} className="p-8 rounded-[28px] bg-slate-900/40 border border-white/10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 font-black flex items-center justify-center text-xl">1</div>
              <AnimatePresence mode="wait">
                <motion.div key={`step1-${channel}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <h3 className="text-xl font-bold">{meta.connectTitle}</h3>
                  <p className="text-slate-400 text-sm mt-1">{meta.connectDesc}</p>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <motion.div variants={fadeInUp} className="p-8 rounded-[28px] bg-slate-900/40 border border-white/10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-xl">2</div>
              <h3 className="text-xl font-bold">Text, Talk, or Send a Photo</h3>
              <p className="text-slate-400 text-sm">Type "Spent $15 for Groceries", send a voice note, or upload a receipt photo — all work instantly.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="p-8 rounded-[28px] bg-slate-900/40 border border-white/10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-xl">3</div>
              <h3 className="text-xl font-bold">Instant Web Sync</h3>
              <p className="text-slate-400 text-sm">Watch real-time visual charts update and export full financial reports easily.</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="scroll-mt-24">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto px-6 py-28 border-t border-white/5"
        >
          <div className="text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Flexible Plans
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
              Pick the perfect plan for your budgeting and tracking needs.
            </p>
          </div>

          {/* Channel Toggle — WhatsApp / Telegram. Selecting a channel here
              swaps the price shown on all 3 cards and carries through to the
              register link, and stays in sync with the switcher in the nav. */}
          <div className="flex items-center justify-center mb-10">
            <ChannelSwitch channel={channel} onChange={setChannel} layoutId="pricing-channel-pill" size="lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`group relative flex flex-col transition-all duration-300 ${
                  plan.highlight
                    ? "scale-[1.02] drop-shadow-[0_0_40px_rgba(52,211,153,0.2)]"
                    : ""
                }`}
              >
                {/* Highlight Badge */}
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 bg-emerald-400 text-slate-950 font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3" />
                    {plan.badge}
                  </div>
                )}

                {/* Speech-bubble shaped "border" layer — mirrors the logo mark's
                    rounded body + notch tail instead of a plain rectangle. */}
                <div
                  aria-hidden
                  className="absolute inset-0 transition-colors duration-300"
                  style={{
                    background: plan.highlight
                      ? "linear-gradient(135deg, #34d399, #38bdf8)"
                      : "rgba(255,255,255,0.14)",
                    WebkitMaskImage: "url('/speech-bubble-mask.svg')",
                    maskImage: "url('/speech-bubble-mask.svg')",
                    WebkitMaskSize: "100% 100%",
                    maskSize: "100% 100%",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                  }}
                />

                {/* Speech-bubble shaped fill layer, inset slightly to leave the
                    border layer visible as a thin outline around the shape. */}
                <div
                  aria-hidden
                  className={`absolute backdrop-blur-xl transition-colors duration-300 ${
                    plan.highlight
                      ? "bg-slate-900/90 group-hover:bg-slate-900/95"
                      : "bg-slate-900/60 group-hover:bg-slate-900/70"
                  }`}
                  style={{
                    inset: plan.highlight ? "2px" : "1.5px",
                    WebkitMaskImage: "url('/speech-bubble-mask.svg')",
                    maskImage: "url('/speech-bubble-mask.svg')",
                    WebkitMaskSize: "100% 100%",
                    maskSize: "100% 100%",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                  }}
                />

                <div className="relative z-10 flex flex-col justify-between h-full pl-7 pr-8 py-7 md:pl-9 md:pr-10 md:py-9">
                  <div>
                  {/* Header */}
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      {plan.name}
                    </span>
                    <div className="relative h-11 md:h-14 mt-2">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={`${plan.id}-${channel}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="absolute inset-0 flex items-baseline gap-1"
                        >
                          <span className="text-4xl md:text-5xl font-black tracking-tight text-white whitespace-nowrap">
                            {plan.prices[channel]}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {plan.period}
                          </span>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    {plan.prices.telegram !== plan.prices.whatsapp && (
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.p
                          key={`save-${plan.id}-${channel}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-[11px] font-semibold mt-0.5"
                        >
                          {channel === "telegram" ? (
                            <span className="text-emerald-400">
                              Save ${(
                                parseFloat(plan.prices.whatsapp.replace("$", "")) -
                                parseFloat(plan.prices.telegram.replace("$", ""))
                              ).toFixed(2)}/mo vs WhatsApp
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              Cheaper on Telegram — from {plan.prices.telegram}/mo
                            </span>
                          )}
                        </motion.p>
                      </AnimatePresence>
                    )}
                    {!plan.highlight && (
                      <p className="text-[11px] text-purple-300 font-medium mt-1">
                        {plan.badge}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {plan.description}
                    </p>
                    {plan.trialNote && (
                      <p className="text-[11px] text-emerald-400 font-medium mt-1">
                        {plan.trialNote[channel]}
                      </p>
                    )}
                  </div>

                  <div className="w-full h-[1px] bg-white/10 my-6" />

                  {/* Features List */}
                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-xs">
                        {feat.included ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <span className={feat.included ? "text-slate-200" : "text-slate-500 line-through"}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  </div>

                  {/* Action Button — plan + channel both carry through to register */}
                  <Link
                    href={`/register?plan=${plan.id}&channel=${channel}&type=direct`}
                    className={`w-full py-3.5 px-4 rounded-xl text-center text-xs tracking-wider uppercase font-bold transition flex items-center justify-center gap-2 cursor-pointer ${plan.buttonClass}`}
                  >
                    <span>{plan.buttonText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Full Feature Comparison — collapsible row-by-row table below the cards */}
          <div className="max-w-6xl mx-auto mt-10">
            <button
              type="button"
              onClick={() => setShowComparison((v) => !v)}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
            >
              <span>Compare all features</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showComparison ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence initial={false}>
              {showComparison && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-white/10 overflow-x-auto">
                    <table className="w-full text-xs min-w-[520px]">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.03]">
                          <th className="text-left font-semibold text-slate-300 uppercase tracking-wider px-5 py-3">Feature</th>
                          <th className="text-center font-semibold text-slate-300 uppercase tracking-wider px-5 py-3">Lite</th>
                          <th className="text-center font-semibold text-emerald-400 uppercase tracking-wider px-5 py-3">Core</th>
                          <th className="text-center font-semibold text-purple-300 uppercase tracking-wider px-5 py-3">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {FEATURE_COMPARISON.map((row, idx) => (
                          <tr key={idx} className="border-b border-white/5 last:border-b-0 odd:bg-white/[0.015]">
                            <td className="px-5 py-3 text-slate-300">{row.label}</td>
                            {[row.free, row.core, row.max].map((val, i) => (
                              <td key={i} className="px-5 py-3 text-center">
                                {typeof val === "boolean" ? (
                                  val ? (
                                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                                  ) : (
                                    <X className="w-4 h-4 text-slate-600 mx-auto" />
                                  )
                                ) : (
                                  <span className="text-slate-200">{val}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-10 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted payment processing via LemonSqueezy. Cancel anytime.</span>
          </div>
        </motion.div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="scroll-mt-24 max-w-4xl mx-auto px-6 py-28 border-t border-white/5">
        <div className="text-center mb-16 space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan-400">FAQ</div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Is Bro Lite really free forever?",
              a: "Yes! Bro Lite is 100% free forever on both WhatsApp and Telegram. You get 3 daily transactions and 1 daily AI receipt scan at zero cost.",
            },
            {
              q: "What's the difference between using WhatsApp and Telegram?",
              a: "Every feature works identically on both — the same AI parsing, the same dashboard, the same export tools. Telegram plans are simply cheaper to run, so we pass that saving on. Pick whichever app you already chat in.",
            },
            {
              q: "How does AI Receipt Scanning work?",
              a: "Simply snap a photo of any bill or purchase receipt and send it to our WhatsApp or Telegram bot. AI automatically extracts store names, dates, and final bill amounts into your dashboard.",
            },
            {
              q: "Can I upgrade or cancel my subscription anytime?",
              a: "Absolute freedom! You can upgrade from Lite to Core or Max anytime directly through your billing portal with zero long-term commitments, on either channel.",
            },
          ].map((item, index) => (
            <div key={index} className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full p-6 text-left flex justify-between items-center font-bold text-sm sm:text-base hover:text-purple-300 transition"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${activeFaq === index ? "rotate-180 text-purple-400" : "text-slate-500"}`} />
              </button>

              <AnimatePresence>
                {activeFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4"
                  >
                    {item.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="relative p-12 rounded-3xl bg-gradient-to-r from-purple-900/60 via-slate-900 to-emerald-900/60 border border-white/20 text-center space-y-8 overflow-hidden shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight max-w-2xl mx-auto">
            Ready to Master Your Finances Globally?
          </h2>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Join thousands of smart spenders tracking expenses directly inside WhatsApp and Telegram.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register?plan=free&channel=whatsapp&type=direct"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm bg-white text-slate-950 hover:bg-slate-200 transition shadow-2xl shadow-white/20"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Start on WhatsApp</span>
            </Link>
            <Link
              href="/register?plan=free&channel=telegram&type=direct"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm bg-white/10 border border-white/20 text-white hover:bg-white/15 transition"
            >
              <TelegramIcon className="w-4 h-4 text-sky-400" />
              <span>Start on Telegram</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CONTACT US SECTION */}
      <section id="contact" className="scroll-mt-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto px-6 py-28 border-t border-white/5"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-pink-400">Get In Touch</div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">We'd Love to Hear From You</h2>
            <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
              Questions, feedback, or partnership ideas — our team usually replies within 24 hours.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-start">
            {/* Contact Info Cards */}
            <motion.div variants={fadeInUp} className="lg:col-span-4 space-y-4">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-emerald-500/50 transition-all flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Email Us</h3>
                  <a href="mailto:support@brofinai.com" className="text-slate-400 text-xs hover:text-emerald-300 transition-colors">support@brofinai.com</a>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-emerald-500/50 transition-all flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <WhatsAppIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">WhatsApp Support</h3>
                  <span className="text-slate-400 text-xs">+94 729 367 157</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-sky-500/50 transition-all flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <TelegramIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Telegram Support</h3>
                  <span className="text-slate-400 text-xs">@BroFInAi_Support</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-purple-500/50 transition-all flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Call Us</h3>
                  <span className="text-slate-400 text-xs">+94 729 367 157</span>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div variants={fadeInUp} className="lg:col-span-8">
              <form
                onSubmit={handleContactSubmit}
                className="p-6 md:p-8 rounded-3xl bg-slate-900/50 border border-white/10 backdrop-blur-xl space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/60 focus:bg-white/[0.07] transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/60 focus:bg-white/[0.07] transition"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us what's on your mind..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/60 focus:bg-white/[0.07] transition resize-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <AnimatePresence>
                    {contactSent && (
                      <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Message sent — we'll be in touch!
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <button
                    type="submit"
                    className="ml-auto px-8 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 shadow-xl shadow-emerald-500/25 flex items-center gap-2 group transition-transform hover:scale-[1.02]"
                  >
                    <span>Send Message</span>
                    <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            {/* Brand Column */}
            <div className="md:col-span-5 space-y-5">
              <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight w-fit">
                <img src="/logo-icon.png" alt="BroFInAi logo" className="w-9 h-9 object-contain" />
                <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Bro<span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">FInAi</span>
                </span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Track every expense right inside WhatsApp or Telegram. No new apps, no spreadsheets — just message, snap, and go.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <a href="#" aria-label="WhatsApp" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-400/40 transition">
                  <WhatsAppIcon className="w-4 h-4" />
                </a>
                <a href="#" aria-label="Telegram" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-sky-400 hover:border-sky-400/40 transition">
                  <TelegramIcon className="w-4 h-4" />
                </a>
                <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition">
                  <TwitterIcon className="w-4 h-4" />
                </a>
                <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition">
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition">
                  <LinkedinIcon className="w-4 h-4" />
                </a>
                <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition">
                  <FacebookIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">Product</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#features" onClick={(e) => scrollToSection(e, "features")} className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" onClick={(e) => scrollToSection(e, "how-it-works")} className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#pricing" onClick={(e) => scrollToSection(e, "pricing")} className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" onClick={(e) => scrollToSection(e, "faq")} className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">© {new Date().getFullYear()} BroFInAi. All rights reserved.</span>
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Bank-grade encryption on every message
            </span>
          </div>
        </div>
      </footer>

      {/* FLOATING STICKY DOCK — reflects whichever channel is active */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-3xl">
        <div className="p-3 sm:p-4 rounded-full bg-slate-950/80 backdrop-blur-2xl border border-white/20 shadow-2xl flex items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full animate-ping shrink-0 transition-colors duration-500 ${meta.dot}`} />
            <AnimatePresence mode="wait">
              <motion.span
                key={`dock-${channel}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-xs sm:text-sm font-semibold text-slate-200 truncate"
              >
                Free {meta.label} Expense Tracker
              </motion.span>
            </AnimatePresence>
          </div>

          <Link
            href={`/register?plan=free&channel=${channel}&type=direct`}
            className={`px-5 py-2 rounded-full bg-gradient-to-r ${meta.from} ${meta.to} text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg ${meta.glow} whitespace-nowrap shrink-0`}
          >
            <span>Get Started</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}