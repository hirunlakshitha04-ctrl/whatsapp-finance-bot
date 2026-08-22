"use client";

import React, { useState, useEffect } from "react";
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
  Mic,
  DollarSign,
  Wallet,
  Coins,
  CreditCard,
  TrendingUp,
  Download,
  BarChart3,
  UserPlus,
  User,
  MessageCircle,
  Lock,
  Menu,
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
    trialNote: { whatsapp: "7-day free trial, then upgrade to continue", telegram: "Free forever — no subscription required" },
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

// Falling finance-icon background — dollar signs, wallets, coins etc. drop in
// inside circular badges and settle at a spot spread across the FULL height
// of the screen (not just the bottom), each on its own staggered delay and
// cycle length. After holding, each one fades out and falls back in again,
// so it's a continuous, ongoing effect that keeps the whole background
// gradually filling and refilling rather than a one-shot landing. Presets
// are hardcoded (not Math.random) so the server-rendered and
// client-hydrated markup match exactly.
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
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: `${p.left}%`, top: "-14%" }}
            initial={{ y: "-10vh", opacity: 0, scale: 0.4 }}
            animate={{
              y: ["-10vh", p.landY, p.landY, "-10vh"],
              opacity: [0, 1, 1, 0],
              scale: [0.4, 1, 1, 0.4],
            }}
            transition={{
              duration: p.cycleDuration,
              delay: p.delay,
              repeat: Infinity,
              times: [0, 0.18, 0.82, 1], // quick fall in, long hold, quick fade out
              ease: [0.34, 1.56, 0.64, 1], // slight overshoot on landing
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

export default function BroFInAiLandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [contactSending, setContactSending] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [showComparison, setShowComparison] = useState(false);
  const [showDiscountToast, setShowDiscountToast] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.98]);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    setContactError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message.");
      }

      setContactSent(true);
      setContactForm({ name: "", email: "", message: "" });
      setTimeout(() => setContactSent(false), 4000);
    } catch (err) {
      setContactError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setContactSending(false);
    }
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

      {/* Background layer — everything here is pinned at z-0, strictly below
          the "relative z-10" content wrapper further down. Previously these
          used -z-10, which put them BEHIND this div's own background paint
          in some stacking situations and made them invisible; z-0 + an
          explicit z-10 wrapper for the real content guarantees they always
          render above the page background but below every section. */}
      <div className="fixed inset-0 -z-0 pointer-events-none">
        {/* Falling finance-tracker icons drifting down the background */}
        <FallingIcons />

        {/* Ambient Lights — soft, diffused "aurora" blooms rather than hard
            accent blocks, closer to a cinematic generative-AI canvas than a
            flat SaaS gradient. One bloom now tracks the active channel. */}
        <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[170px] pointer-events-none" />
        <div className="fixed top-[35%] right-[-10%] w-[500px] h-[500px] bg-pink-600/8 rounded-full blur-[190px] pointer-events-none" />
        <motion.div
          animate={{ opacity: 1 }}
          className={`fixed bottom-[-10%] left-[20%] w-[550px] h-[550px] rounded-full blur-[160px] pointer-events-none transition-colors duration-700 ${
            channel === "whatsapp" ? "bg-emerald-600/15" : "bg-sky-600/15"
          }`}
        />
      </div>

      {/* Everything below is real page content, pinned above the background
          layer with an explicit z-index so it can never accidentally end up
          behind it, regardless of each section's own background. */}
      <div className="relative z-10">

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
            <a
              href="#pricing"
              onClick={(e) => scrollToSection(e, "pricing")}
              className="group relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-xs bg-white text-slate-950 hover:bg-slate-200 transition shadow-lg shadow-white/10 flex items-center gap-1.5 overflow-hidden whitespace-nowrap cursor-pointer"
            >
              <span className="hidden sm:inline">Get Started</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden w-9 h-9 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:border-white/20 transition"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* MOBILE NAV DRAWER — the section links above are "hidden lg:flex",
            so below the lg breakpoint this is the only way to reach
            Features / How It Works / Pricing / FAQ / Contact from the nav. */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="lg:hidden overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-2 pt-4 pb-2 flex flex-col gap-1 text-sm font-medium text-slate-300">
                <a
                  href="#features"
                  onClick={(e) => { scrollToSection(e, "features"); setMobileMenuOpen(false); }}
                  className="px-3 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  onClick={(e) => { scrollToSection(e, "how-it-works"); setMobileMenuOpen(false); }}
                  className="px-3 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#pricing"
                  onClick={(e) => { scrollToSection(e, "pricing"); setMobileMenuOpen(false); }}
                  className="px-3 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  onClick={(e) => { scrollToSection(e, "faq"); setMobileMenuOpen(false); }}
                  className="px-3 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                >
                  FAQ
                </a>
                <a
                  href="#contact"
                  onClick={(e) => { scrollToSection(e, "contact"); setMobileMenuOpen(false); }}
                  className="px-3 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                >
                  Contact
                </a>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="sm:hidden px-3 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors border-t border-white/5 mt-1 pt-4"
                >
                  Login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* TELEGRAM DISCOUNT POPUP — shows while browsing on WhatsApp to nudge
          toward the cheaper Telegram plans; disappears once they switch. */}
      <AnimatePresence>
        {showDiscountToast && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[90] w-[94%] max-w-xl"
          >
            <div className="relative">
              {/* Soft gradient glow behind the glass card */}
              <div
                aria-hidden
                className="absolute -inset-6 rounded-[36px] bg-gradient-to-r from-sky-500/35 via-blue-400/25 to-cyan-400/35 blur-3xl pointer-events-none"
              />

              {/* Gradient border wrapper */}
              <div className="relative rounded-[28px] p-[1.5px] bg-gradient-to-br from-sky-400/70 via-white/10 to-cyan-400/50 shadow-2xl shadow-sky-500/25">
                <div className="relative overflow-hidden rounded-[26.5px] bg-slate-950/85 backdrop-blur-2xl px-6 py-7 sm:px-10 sm:py-9 text-center">
                  {/* subtle inner sheen + glow accents */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-sky-500/[0.08] pointer-events-none" />
                  <div aria-hidden className="absolute -top-14 -right-14 w-40 h-40 rounded-full bg-sky-400/20 blur-3xl pointer-events-none" />
                  <div aria-hidden className="absolute -bottom-14 -left-14 w-40 h-40 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />

                  <button
                    type="button"
                    onClick={() => setShowDiscountToast(false)}
                    aria-label="Dismiss"
                    className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="relative flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-sky-500/30 mb-4">
                      <Send className="w-8 h-8" />
                    </div>

                    <p className="text-lg sm:text-xl font-black text-white leading-snug">
                      Save more on Telegram 🎉
                    </p>

                    <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent mt-2 tracking-tight">
                      Up to ${BEST_TELEGRAM_SAVING.amount.toFixed(2)}/mo
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setChannel("telegram");
                        setShowDiscountToast(false);
                      }}
                      className="group inline-flex items-center gap-2 mt-5 text-sm font-bold text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 transition-colors px-6 py-3 rounded-full shadow-md shadow-sky-500/25"
                    >
                      Switch to Telegram
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
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
              <span>
                💬 Your AI money manager, inside {meta.label}
              </span>
            </motion.div>
          </AnimatePresence>

          <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[1.08]">
            Your AI Money Manager.
            <br />
            Inside{" "}
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
            .
          </h1>

          <p className="text-slate-400 text-lg max-w-lg font-normal leading-relaxed">
            Track spending, organize your transactions, and manage your money — all through chat.
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

        {/* Dynamic Phone Mockup — a realistic device frame running the chat,
            with small glass "dashboard" cards orbiting it. Chrome, accent,
            and copy all swap with the active channel so the preview never
            lies about which app it's simulating. */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="lg:col-span-6 relative flex justify-center items-center min-h-[560px] sm:min-h-[620px]"
        >
          {/* Soft glow behind the phone */}
          <div
            className={`absolute w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] rounded-full blur-[100px] opacity-30 bg-gradient-to-br ${meta.from} ${meta.to} transition-colors duration-500`}
          />

          {/* Floating dashboard cards — orbit the phone, hidden on the
              smallest screens to keep the mockup uncluttered. */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="hidden sm:block absolute left-0 top-6 z-20"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="px-4 py-3 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-xl space-y-0.5 w-[168px]"
            >
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">💰 Monthly Spending</div>
              <div className="text-lg font-bold text-white">$1,240</div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75 }}
            className="hidden sm:block absolute right-0 top-16 z-20"
          >
            <motion.div
              animate={{ y: [0, 9, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="px-4 py-3 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-xl space-y-0.5 w-[152px]"
            >
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">🍔 Food</div>
              <div className="text-lg font-bold text-white">$180</div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="hidden sm:block absolute left-2 bottom-24 z-20"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              className="px-4 py-3 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-xl space-y-1.5 w-[172px]"
            >
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">📊 Budget Used</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full w-[64%] rounded-full bg-gradient-to-r ${meta.from} ${meta.to}`} />
                </div>
                <span className="text-xs font-bold text-white">64%</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 1.05 }}
            className="hidden sm:block absolute right-1 bottom-8 z-20"
          >
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
              className="px-4 py-3 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-xl flex items-center gap-2 w-[168px]"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/5 ${meta.text}`}>
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] font-semibold text-slate-200 leading-tight">Receipt Scanned</div>
            </motion.div>
          </motion.div>

          {/* Phone frame */}
          <div className={`relative z-10 w-[min(280px,80vw)] sm:w-[300px] rounded-[2.75rem] border-[6px] border-slate-800 bg-slate-950 shadow-2xl transition-colors duration-500 ${meta.glow} shadow-2xl`}>
            {/* Dynamic island / notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-950 rounded-b-2xl z-30" />

            <div className="relative rounded-[2.25rem] overflow-hidden bg-slate-900">
              {/* Chat app header */}
              <div className="flex items-center justify-between px-4 pt-8 pb-3 bg-slate-950/60 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 ${meta.text}`}>
                    <ChannelIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">BroFInAi Bot</div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`handle-${channel}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[10px] font-mono text-slate-500"
                      >
                        {meta.handle}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
                <span className={`w-2 h-2 rounded-full ${meta.dot} shadow-[0_0_8px] shadow-current`} />
              </div>

              {/* Chat body */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`chat-${channel}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="px-3.5 py-4 space-y-2.5 font-sans text-[11.5px] min-h-[260px]"
                >
                  <div
                    className={`p-2.5 rounded-2xl rounded-tr-sm max-w-[80%] ml-auto shadow-md border ${
                      channel === "whatsapp"
                        ? "bg-emerald-600/30 border-emerald-500/30 text-emerald-100"
                        : "bg-sky-600/30 border-sky-500/30 text-sky-100"
                    }`}
                  >
                    Spent $25 on lunch
                  </div>

                  <div className="bg-slate-800/90 border border-white/10 text-slate-200 p-3 rounded-2xl rounded-tl-sm max-w-[85%] space-y-1.5 shadow-lg">
                    <div className={`flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider ${meta.text}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Expense recorded
                    </div>
                    <div className="text-slate-300">
                      Lunch — <b className="text-white">$25</b>
                    </div>
                    <div className="pt-1 mt-1 border-t border-white/10 text-[10px] text-slate-400">
                      Today's total: <b className="text-white">$42</b>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Fake input bar for realism */}
              <div className="px-3.5 pb-4 pt-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-950/70 border border-white/10 text-[10px] text-slate-500">
                  <span className="flex-1">Message</span>
                  <Mic className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* FEATURES SECTION — asymmetric product showcase. The left panel is a
          live, channel-aware chat mockup (follows the same `channel` state
          as the rest of the page); the right stack demonstrates voice,
          receipt OCR, and the dashboard. Only real, shipped capabilities. */}
      <section id="features" className="scroll-mt-24 relative overflow-hidden">
        {/* Ambient background glow — subtle, not the visual focus */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/4 w-[520px] h-[520px] rounded-full bg-emerald-500/10 blur-[140px]" />
          <div className="absolute top-1/3 -right-20 w-[480px] h-[480px] rounded-full bg-cyan-500/10 blur-[140px]" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative max-w-7xl mx-auto px-6 py-28 border-t border-white/5"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/90">Core Features</div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Manage Your Money
              </span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto">
              Simple tools that turn everyday messages into organized financial data.
            </p>
          </motion.div>

          {/* Floating ambient icons around the showcase — very subtle, blurred */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[18%] left-[2%] w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/10 backdrop-blur-sm flex items-center justify-center opacity-40 blur-[0.5px]"
            >
              <DollarSign className="w-4 h-4 text-emerald-300" />
            </motion.div>
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="absolute top-[8%] right-[6%] w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400/10 backdrop-blur-sm flex items-center justify-center opacity-40 blur-[0.5px]"
            >
              <Receipt className="w-4 h-4 text-cyan-300" />
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
              className="absolute bottom-[10%] right-[3%] w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-400/10 backdrop-blur-sm flex items-center justify-center opacity-40 blur-[0.5px]"
            >
              <BarChart3 className="w-4 h-4 text-emerald-300" />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative">
            {/* LEFT — AI Chat Logging showcase (large, channel-aware) */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`lg:col-span-3 group relative rounded-[28px] bg-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-emerald-400/40 shadow-2xl overflow-hidden transition-colors duration-300`}
            >
              {/* inner glow on hover */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-cyan-500/[0.06]" />

              <div className="relative p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                    <MessageSquare className="w-4 h-4" />
                    AI Chat Logging
                  </div>
                  <ChannelSwitch channel={channel} onChange={setChannel} layoutId="features-chat-pill" />
                </div>

                {/* Chat window */}
                <div className={`rounded-2xl bg-slate-950/70 border transition-colors duration-500 ${meta.ring} overflow-hidden`}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 ${meta.text}`}>
                        <ChannelIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white leading-tight">BroFInAi</div>
                        <div className="text-[11px] text-slate-500 leading-tight">AI Money Manager</div>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-[11px] font-medium ${meta.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} shadow-[0_0_6px] shadow-current`} />
                      Online
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`features-chat-${channel}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 sm:p-5 space-y-3 min-h-[210px]"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className={`p-3 rounded-2xl rounded-tr-sm max-w-[75%] ml-auto text-sm shadow-md border ${
                          channel === "whatsapp"
                            ? "bg-emerald-600/25 border-emerald-500/30 text-emerald-100"
                            : "bg-sky-600/25 border-sky-500/30 text-sky-100"
                        }`}
                      >
                        Spent $25 on lunch
                      </motion.div>

                      {/* typing indicator */}
                      <motion.div
                        initial={{ opacity: 1 }}
                        whileInView={{ opacity: [1, 1, 0] }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.55, times: [0, 0.7, 1] }}
                        className="flex items-center gap-1 bg-slate-800/70 border border-white/10 w-fit px-3.5 py-2.5 rounded-2xl rounded-tl-sm"
                      >
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                            className="w-1.5 h-1.5 rounded-full bg-slate-400"
                          />
                        ))}
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.9 }}
                        className="bg-slate-800/80 border border-white/10 text-slate-200 p-4 rounded-2xl rounded-tl-sm max-w-[92%] space-y-3 shadow-lg"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Expense recorded
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-slate-500 text-[10px] mb-0.5">Category</div>
                            <div className="text-white font-semibold">Lunch</div>
                          </div>
                          <div>
                            <div className="text-slate-500 text-[10px] mb-0.5">Amount</div>
                            <div className="text-white font-semibold">$25</div>
                          </div>
                          <div>
                            <div className="text-slate-500 text-[10px] mb-0.5">Status</div>
                            <div className="text-emerald-400 font-semibold">Added</div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 1.1 }}
                  className="flex items-center gap-2 text-xs text-slate-500"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Transaction synced to dashboard
                </motion.div>
              </div>
            </motion.div>

            {/* RIGHT — Voice / Receipt OCR / Dashboard stack */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* VOICE */}
              <motion.div
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group relative p-6 rounded-[24px] bg-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-orange-400/40 shadow-xl overflow-hidden transition-colors duration-300"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-orange-500/[0.06] to-transparent" />
                <div className="relative flex items-start gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-white mb-1">Track by Voice</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-3">
                      Send a voice note and AI turns it into a structured transaction.
                    </p>
                    <div className="rounded-xl bg-slate-950/60 border border-white/10 px-3 py-2.5 flex items-center gap-3 transition-colors duration-300 group-hover:bg-slate-950/80">
                      <div className="flex items-end gap-[2.5px] h-4">
                        {[4, 9, 6, 13, 7, 10, 5, 8, 4].map((h, i) => (
                          <span
                            key={i}
                            className="w-[2.5px] rounded-full bg-orange-400/70"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">00:08</span>
                      <span className="ml-auto text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        Groceries · $18 <Check className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* RECEIPT OCR */}
              <motion.div
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group relative p-6 rounded-[24px] bg-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-purple-400/40 shadow-xl overflow-hidden transition-colors duration-300"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-purple-500/[0.06] to-transparent" />
                <div className="relative flex items-start gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-white mb-1">AI Receipt OCR</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-3">
                      Send a receipt photo and AI extracts the details automatically.
                    </p>
                    <div className="rounded-xl bg-slate-950/60 border border-white/10 p-2.5 flex items-center gap-3 transition-colors duration-300 group-hover:bg-slate-950/80">
                      <div className="relative w-10 h-12 shrink-0 rounded-md bg-white/5 border border-white/10 overflow-hidden">
                        <div className="absolute inset-x-1 top-1.5 space-y-1">
                          <div className="h-[3px] bg-white/20 rounded-full" />
                          <div className="h-[3px] bg-white/15 rounded-full w-3/4" />
                          <div className="h-[3px] bg-white/15 rounded-full w-full" />
                          <div className="h-[3px] bg-white/15 rounded-full w-2/3" />
                        </div>
                        <motion.div
                          animate={{ top: ["10%", "90%", "10%"] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute left-0 right-0 h-[2px] bg-purple-400/80 shadow-[0_0_6px] shadow-purple-400/70"
                        />
                      </div>
                      <div className="text-[11px] space-y-1 min-w-0">
                        <div className="flex gap-1.5">
                          <span className="text-slate-500 shrink-0">Merchant</span>
                          <span className="text-white font-semibold truncate">Cafe Nero</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="text-slate-500 shrink-0">Category</span>
                          <span className="text-white font-semibold truncate">Food & Dining</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="text-slate-500 shrink-0">Total</span>
                          <span className="text-purple-300 font-semibold">$42.80</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* DASHBOARD & EXPORT */}
              <motion.div
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group relative p-6 rounded-[24px] bg-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-cyan-400/40 shadow-xl overflow-hidden transition-colors duration-300"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-cyan-500/[0.06] to-transparent" />
                <div className="relative flex items-start gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-white mb-1">Dashboard & Excel Export</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-3">
                      See your finances clearly and export your data whenever you need.
                    </p>
                    <div className="rounded-xl bg-slate-950/60 border border-white/10 p-3 space-y-2.5 transition-colors duration-300 group-hover:bg-slate-950/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Monthly spending</span>
                        <span className="text-xs font-bold text-white">$1,240</span>
                      </div>
                      <div className="flex items-end gap-1 h-8">
                        {[40, 65, 30, 80, 55, 90, 45].map((h, i) => (
                          <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-cyan-500/70 to-emerald-400/70" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-white/10">
                        <span className="text-[10px] text-slate-500">Recent: Lunch, Uber, Groceries</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-300">
                          <Download className="w-3 h-3" /> .xlsx
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS — a connected onboarding journey (register → connect →
          manage), not three generic cards. Channel choice is de-emphasized
          here (no big toggle) but Step 02's preview still quietly follows
          the shared `channel` state so WhatsApp and Telegram both feel at
          home in the flow. */}
      <section id="how-it-works" className="scroll-mt-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-1/3 w-[480px] h-[480px] rounded-full bg-emerald-500/10 blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-cyan-500/10 blur-[140px]" />
          <div className="absolute top-1/2 left-10 w-[300px] h-[300px] rounded-full bg-purple-500/[0.06] blur-[120px]" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative max-w-7xl mx-auto px-6 py-28 border-t border-white/5"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/90">Step-by-Step</div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">How It Works</h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto pt-1">
              Start managing your money in just three simple steps.
            </p>
            <p className="text-slate-600 text-xs pt-1">WhatsApp recommended · Telegram also available</p>
          </motion.div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Desktop connector line — subtle purple → emerald → cyan,
                with a small glow traveling along it to signal progression. */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="hidden md:block absolute left-[16%] right-[16%] top-[60px] h-px origin-left bg-gradient-to-r from-purple-400/40 via-emerald-400/40 to-cyan-400/40"
            >
              <motion.div
                animate={{ left: ["0%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_10px_4px] shadow-emerald-400/50"
              />
            </motion.div>

            {/* Mobile connector — vertical, between stacked cards */}
            <div className="md:hidden absolute left-[43px] top-[60px] bottom-[60px] w-px bg-gradient-to-b from-purple-400/30 via-emerald-400/30 to-cyan-400/30" />

            {/* STEP 01 — Create Your Account */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -5, scale: 1.01 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group relative rounded-[28px] bg-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-purple-400/40 shadow-xl overflow-hidden transition-colors duration-300 p-8 space-y-5"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-purple-500/[0.07] to-transparent" />

              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-purple-500/15 border border-purple-400/20 flex flex-col items-center justify-center gap-0.5 transition-transform duration-300 group-hover:scale-110">
                  <span className="text-[9px] font-black tracking-widest text-purple-300/70">01</span>
                  <UserPlus className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Step 01</div>
                  <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">Create Your Account</h3>
                </div>
              </div>

              <p className="relative text-slate-400 text-sm leading-relaxed">
                Register in seconds and get your BroFInAi account ready.
              </p>

              {/* Mini registration preview */}
              <div className="relative rounded-2xl bg-slate-950/60 border border-white/10 p-4 space-y-2.5 transition-colors duration-300 group-hover:bg-slate-950/80">
                <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-[11px] text-slate-400">Name</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-[11px] text-slate-400">Email</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-[11px] text-slate-400">Password</span>
                </div>
                <div className="w-full text-center rounded-lg bg-gradient-to-r from-purple-400/90 to-purple-300/90 text-slate-950 text-[11px] font-bold py-2 mt-1">
                  Create Account
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Account ready
                </div>
              </div>

              <Link
                href="/register"
                className="relative inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-purple-200 transition-colors group/link"
              >
                Register Free
                <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* STEP 02 — Connect & Start Tracking */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -5, scale: 1.01 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group relative rounded-[28px] bg-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-emerald-400/40 shadow-xl overflow-hidden transition-colors duration-300 p-8 space-y-5"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-emerald-500/[0.07] to-transparent" />

              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 flex flex-col items-center justify-center gap-0.5 transition-transform duration-300 group-hover:scale-110">
                  <span className="text-[9px] font-black tracking-widest text-emerald-300/70">02</span>
                  <MessageCircle className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Step 02</div>
                  <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">Connect & Start Tracking</h3>
                </div>
              </div>

              <p className="relative text-slate-400 text-sm leading-relaxed">
                Connect WhatsApp and send a text, voice note, or receipt.
              </p>

              {/* Mini chat preview — quietly follows the active channel */}
              <div className={`relative rounded-2xl bg-slate-950/60 border transition-colors duration-500 ${meta.ring} overflow-hidden`}>
                <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-white/10 bg-white/[0.02]">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-white/5 ${meta.text}`}>
                    <ChannelIcon className="w-3 h-3" />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`hiw-label-${channel}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] font-mono text-slate-500"
                    >
                      {meta.label}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <div className="p-3.5 space-y-2">
                  <div
                    className={`p-2.5 rounded-2xl rounded-tr-sm max-w-[80%] ml-auto text-[11.5px] shadow-md border ${
                      channel === "whatsapp"
                        ? "bg-emerald-600/25 border-emerald-500/30 text-emerald-100"
                        : "bg-sky-600/25 border-sky-500/30 text-sky-100"
                    }`}
                  >
                    Spent $15 on groceries
                  </div>
                  <div className="bg-slate-800/80 border border-white/10 text-slate-200 p-3 rounded-2xl rounded-tl-sm max-w-[85%] space-y-1 shadow-lg">
                    <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Added
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Groceries — <b className="text-white">$15</b>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-3.5 pb-3 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
                    <Mic className="w-3 h-3" /> Voice
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
                    <Receipt className="w-3 h-3" /> Receipt
                  </span>
                </div>
              </div>
            </motion.div>

            {/* STEP 03 — See Your Money Clearly */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -5, scale: 1.01 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group relative rounded-[28px] bg-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-cyan-400/40 shadow-xl overflow-hidden transition-colors duration-300 p-8 space-y-5"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-cyan-500/[0.07] to-transparent" />

              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-cyan-500/15 border border-cyan-400/20 flex flex-col items-center justify-center gap-0.5 transition-transform duration-300 group-hover:scale-110">
                  <span className="text-[9px] font-black tracking-widest text-cyan-300/70">03</span>
                  <BarChart3 className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Step 03</div>
                  <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">See Your Money Clearly</h3>
                </div>
              </div>

              <p className="relative text-slate-400 text-sm leading-relaxed">
                Your transactions sync to your dashboard so you can review and manage everything.
              </p>

              {/* Mini dashboard preview */}
              <div className="relative rounded-2xl bg-slate-950/60 border border-white/10 p-4 space-y-3 transition-colors duration-300 group-hover:bg-slate-950/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Monthly Spending</span>
                  <span className="text-sm font-bold text-white">$428.50</span>
                </div>

                <div className="space-y-1.5">
                  {[
                    { label: "Food", value: "$180", pct: 42, color: "from-cyan-400 to-emerald-400" },
                    { label: "Transport", value: "$92", pct: 21, color: "from-cyan-400/80 to-emerald-400/80" },
                    { label: "Other", value: "$156.50", pct: 37, color: "from-cyan-400/60 to-emerald-400/60" },
                  ].map((row) => (
                    <div key={row.label} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">{row.label}</span>
                        <span className="text-slate-300 font-semibold">{row.value}</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${row.color}`} style={{ width: `${row.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-[10px] text-slate-500">Full report</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-300">
                    <Download className="w-3 h-3" /> Export .xlsx
                  </span>
                </div>
              </div>
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
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Plans That Fit How You Use BroFInAi
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white">
              Choose How You Want to Track
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
              Start free, then choose the experience that works best for you.
            </p>
          </div>

          {/* Channel chooser — two premium cards that double as the channel
              toggle. Selecting one updates `channel`, which drives the price
              shown on every plan card below. WhatsApp is positioned as the
              recommended, full-featured experience with its 7-day trial;
              Telegram as a genuinely free, permanent alternative — neither
              is framed as a discount or a downgrade. */}
          <div className="max-w-3xl mx-auto mb-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* WhatsApp option */}
            <button
              type="button"
              onClick={() => setChannel("whatsapp")}
              aria-pressed={channel === "whatsapp"}
              className={`group relative text-left rounded-[26px] border backdrop-blur-xl p-6 transition-all duration-300 ${
                channel === "whatsapp"
                  ? "border-emerald-400/60 bg-slate-900/80 shadow-[0_0_40px_rgba(52,211,153,0.15)]"
                  : "border-white/10 bg-slate-900/40 hover:border-emerald-400/30 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> Recommended
                </span>
                {channel === "whatsapp" && (
                  <span className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-slate-950" strokeWidth={3} />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <WhatsAppIcon className="w-5 h-5 text-emerald-400" />
                <span className="text-lg font-bold text-white">WhatsApp</span>
              </div>

              <div className="text-2xl font-black text-emerald-400 tracking-tight mb-1">7 DAYS FREE</div>
              <p className="text-slate-400 text-xs leading-relaxed">Try BroFInAi free on WhatsApp for 7 days.</p>
              <p className="text-slate-500 text-xs leading-relaxed mt-1">Then choose a paid plan to continue.</p>

              <Link
                href="/register?plan=free&channel=whatsapp&type=direct"
                onClick={(e) => e.stopPropagation()}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Start Free on WhatsApp
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </button>

            {/* Telegram option */}
            <button
              type="button"
              onClick={() => setChannel("telegram")}
              aria-pressed={channel === "telegram"}
              className={`group relative text-left rounded-[26px] border backdrop-blur-xl p-6 transition-all duration-300 ${
                channel === "telegram"
                  ? "border-sky-400/60 bg-slate-900/80 shadow-[0_0_40px_rgba(56,189,248,0.15)]"
                  : "border-white/10 bg-slate-900/40 hover:border-sky-400/30 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> Free Forever
                </span>
                {channel === "telegram" && (
                  <span className="w-5 h-5 rounded-full bg-sky-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-slate-950" strokeWidth={3} />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <TelegramIcon className="w-5 h-5 text-sky-400" />
                <span className="text-lg font-bold text-white">Telegram</span>
              </div>

              <div className="text-2xl font-black text-sky-400 tracking-tight mb-1">$0</div>
              <p className="text-slate-400 text-xs leading-relaxed">Track your money on Telegram with no subscription required.</p>

              <Link
                href="/register?plan=free&channel=telegram&type=direct"
                onClick={(e) => e.stopPropagation()}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
              >
                Start Free on Telegram
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </button>
          </div>

          <p className="max-w-lg mx-auto text-center text-[11px] text-slate-600 leading-relaxed mb-14">
            WhatsApp messaging has higher operating costs, while Telegram bot messaging is significantly cheaper to operate. That's why pricing differs by channel.
          </p>

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

                {/* Card background — plain rounded box (previously a speech-bubble
                    mask shape; swapped for a simpler flat card). */}
                <div
                  className={`absolute inset-0 rounded-3xl border transition-colors duration-300 backdrop-blur-xl ${
                    plan.highlight
                      ? "border-emerald-400/60 bg-slate-900/90 group-hover:bg-slate-900/95 shadow-[0_0_40px_rgba(52,211,153,0.15)]"
                      : "border-white/10 bg-slate-900/60 group-hover:bg-slate-900/70"
                  }`}
                />

                <div className="relative z-10 flex flex-col justify-between h-full px-7 py-7 md:px-9 md:py-9">
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
                    {plan.id === "free" ? (
                      <p className="text-[11px] font-medium mt-0.5 text-emerald-400">
                        {channel === "whatsapp" ? "7-Day Trial" : "Free Forever"}
                      </p>
                    ) : (
                      plan.prices.telegram !== plan.prices.whatsapp && (
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Price varies by channel
                        </p>
                      )
                    )}
                    {!plan.highlight && plan.id !== "free" && (
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
            Be one of the first to experience smarter money management.
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
                    {contactError && (
                      <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-red-400 font-semibold"
                      >
                        {contactError}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <button
                    type="submit"
                    disabled={contactSending}
                    className="ml-auto px-8 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 shadow-xl shadow-emerald-500/25 flex items-center gap-2 group transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <span>{contactSending ? "Sending..." : "Send Message"}</span>
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
    </div>
  );
}