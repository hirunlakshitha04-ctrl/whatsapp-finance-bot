"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, Variants } from "framer-motion";
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
  CreditCard,
  TrendingUp,
  Download,
  BarChart3,
  UserPlus,
  User,
  MessageCircle,
  Lock,
  Menu,
  ArrowLeft,
  MoreVertical,
  Utensils,
  Car,
  ShoppingBag,
  Paperclip,
  Languages,
  Brain,
  Bell,
  Eye,
  Plus,
  Home,
  Play,
  Clock,
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
    heroGrad: string;
  }
> = {
  whatsapp: {
    label: "WhatsApp",
    icon: WhatsAppIcon,
    from: "from-emerald-400",
    via: "via-teal-300",
    to: "to-cyan-400",
    text: "text-emerald-600",
    dot: "bg-emerald-400",
    ring: "border-emerald-200",
    glow: "shadow-emerald-500/25",
    handle: "+ 94 71 636 3235",
    badge: "Live now on WhatsApp",
    connectTitle: "Save the WhatsApp Number",
    connectDesc: "Save our WhatsApp business number and send \"Hi\" to instantly link your account.",
    exampleMessage: "Spent $45.50 on Coffee & Breakfast ☕",
    heroGrad: "from-emerald-300 via-teal-200 to-cyan-300",
  },
  telegram: {
    label: "Telegram",
    icon: TelegramIcon,
    from: "from-sky-400",
    via: "via-blue-300",
    to: "to-cyan-400",
    text: "text-sky-600",
    dot: "bg-sky-400",
    ring: "border-sky-200",
    glow: "shadow-sky-500/25",
    handle: "@BroFInAi_Bot",
    badge: "Live now on Telegram",
    connectTitle: "Start the Telegram Bot",
    connectDesc: "Search @BroFInAi_Bot on Telegram and hit Start to instantly link your account.",
    exampleMessage: "Spent $45.50 on Coffee & Breakfast ☕",
    heroGrad: "from-sky-300 via-cyan-200 to-teal-300",
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
    buttonClass: "bg-slate-900 hover:bg-slate-800 text-white",
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
  variant = "light",
}: {
  channel: Channel;
  onChange: (c: Channel) => void;
  layoutId: string;
  size?: "sm" | "lg";
  variant?: "light" | "dark";
}) {
  const isLg = size === "lg";
  const dark = variant === "dark";
  return (
    <div
      className={`relative inline-flex items-center gap-1 rounded-full ${
        dark ? "bg-white/5 border border-white/10" : "bg-slate-900/5 border border-slate-200"
      } ${isLg ? "p-1.5" : "p-1"}`}
    >
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
            } ${active ? "text-slate-950" : dark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
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
  const [contactSending, setContactSending] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [showComparison, setShowComparison] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  const meta = CHANNEL_META[channel];
  const ChannelIcon = meta.icon;

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.98]);

  // Hero phone tilt — the phone rotates in 3D as the cursor moves across
  // its container, easing back to a resting tilt when the mouse leaves.
  const phoneRotateX = useMotionValue(6);
  const phoneRotateY = useMotionValue(-22);
  const springRotateX = useSpring(phoneRotateX, { stiffness: 120, damping: 18, mass: 0.6 });
  const springRotateY = useSpring(phoneRotateY, { stiffness: 120, damping: 18, mass: 0.6 });

  const handlePhoneMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0 -> 1
    const py = (e.clientY - rect.top) / rect.height; // 0 -> 1
    phoneRotateY.set((px - 0.5) * 360); // full spin left/right
    phoneRotateX.set((0.5 - py) * 140); // deep tilt up/down
  };

  const handlePhoneMouseLeave = () => {
    phoneRotateX.set(6);
    phoneRotateY.set(-22);
  };

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
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-200 selection:text-slate-900 font-sans overflow-x-hidden relative pb-28">

      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600 z-[100] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Background layer — everything here is pinned at z-0, strictly below
          the "relative z-10" content wrapper further down. Previously these
          used -z-10, which put them BEHIND this div's own background paint
          in some stacking situations and made them invisible; z-0 + an
          explicit z-10 wrapper for the real content guarantees they always
          render above the page background but below every section. */}
      <div className="fixed inset-0 -z-0 pointer-events-none">
        {/* Ambient Lights — a single, restrained soft-green bloom instead of
            the previous purple/pink "AI canvas" look. Calmer, whiter, more
            enterprise-fintech: closer to a trusted global finance brand than
            a flashy generative-AI demo. One bloom still tracks the active
            channel so the page keeps its living, product-aware feel. */}
        <div className="fixed top-[-15%] right-[-10%] w-[560px] h-[560px] bg-emerald-100/60 rounded-full blur-[170px] pointer-events-none" />
        <motion.div
          animate={{ opacity: 1 }}
          className={`fixed bottom-[-10%] left-[10%] w-[520px] h-[520px] rounded-full blur-[170px] pointer-events-none transition-colors duration-700 ${
            channel === "whatsapp" ? "bg-emerald-500/10" : "bg-sky-500/10"
          }`}
        />
      </div>

      {/* Everything below is real page content, pinned above the background
          layer with an explicit z-index so it can never accidentally end up
          behind it, regardless of each section's own background. */}
      <div className="relative z-10">

      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight shrink-0">
            <img src="/logo-icon.png" alt="BroFInAi logo" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-black bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent hidden sm:inline">
              Bro<span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">FInAi</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" onClick={(e) => scrollToSection(e, "features")} className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#language" onClick={(e) => scrollToSection(e, "language")} className="hover:text-slate-900 transition-colors">Language</a>
            <a href="#how-it-works" onClick={(e) => scrollToSection(e, "how-it-works")} className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, "pricing")} className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, "faq")} className="hover:text-slate-900 transition-colors">FAQ</a>
            <a href="#contact" onClick={(e) => scrollToSection(e, "contact")} className="hover:text-slate-900 transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ChannelSwitch channel={channel} onChange={setChannel} layoutId="nav-channel-pill" />
            <Link href="/login" prefetch={false} className="hidden sm:inline text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition whitespace-nowrap">
              Login
            </Link>
            <a
              href="#pricing"
              onClick={(e) => scrollToSection(e, "pricing")}
              className="group relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-xs bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 overflow-hidden whitespace-nowrap cursor-pointer"
            >
              <span className="hidden sm:inline">Get Started</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden w-9 h-9 shrink-0 rounded-full bg-slate-900/5 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-200 transition"
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
              <div className="max-w-7xl mx-auto px-2 pt-4 pb-2 flex flex-col gap-1 text-sm font-medium text-slate-600">
                <a
                  href="#features"
                  onClick={(e) => { scrollToSection(e, "features"); setMobileMenuOpen(false); }}
                  className="px-3 py-3 rounded-xl hover:bg-slate-900/5 hover:text-slate-900 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#language"
                  onClick={(e) => { scrollToSection(e, "language"); setMobileMenuOpen(false); }}
                  className="px-3 py-3 rounded-xl hover:bg-slate-900/5 hover:text-slate-900 transition-colors"
                >
                  Language
                </a>
                <a
                  href="#how-it-works"
                  onClick={(e) => { scrollToSection(e, "how-it-works"); setMobileMenuOpen(false); }}
                  className="px-3 py-3 rounded-xl hover:bg-slate-900/5 hover:text-slate-900 transition-colors"
                >
                  How It Works
                </a>
                <a
                  href="#pricing"
                  onClick={(e) => { scrollToSection(e, "pricing"); setMobileMenuOpen(false); }}
                  className="px-3 py-3 rounded-xl hover:bg-slate-900/5 hover:text-slate-900 transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  onClick={(e) => { scrollToSection(e, "faq"); setMobileMenuOpen(false); }}
                  className="px-3 py-3 rounded-xl hover:bg-slate-900/5 hover:text-slate-900 transition-colors"
                >
                  FAQ
                </a>
                <a
                  href="#contact"
                  onClick={(e) => { scrollToSection(e, "contact"); setMobileMenuOpen(false); }}
                  className="px-3 py-3 rounded-xl hover:bg-slate-900/5 hover:text-slate-900 transition-colors"
                >
                  Contact
                </a>
                <Link
                  href="/login"
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className="sm:hidden px-3 py-3 rounded-xl hover:bg-slate-900/5 hover:text-slate-900 transition-colors border-t border-slate-200 mt-1 pt-4"
                >
                  Login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO SECTION — light, white background. Wrapped in its own block so
          only the hero (and the nav sitting directly on top of it) share
          this treatment; every section below keeps the site's normal light
          theme, untouched. */}
      <div className="relative bg-white overflow-hidden">
        {/* Ambient light-hero glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[560px] h-[560px] bg-purple-200/30 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-[-25%] right-[5%] w-[520px] h-[520px] bg-emerald-200/30 rounded-full blur-[160px] pointer-events-none" />
        {/* Subtle floating dollar-sign markers, echoing the reference screenshot */}
        <div className="hidden sm:flex absolute left-[27%] top-[12%] w-10 h-10 rounded-full border border-slate-200 items-center justify-center text-slate-400">
          <span className="text-sm font-bold">$</span>
        </div>
        <div className="hidden sm:flex absolute left-[42%] top-[40%] w-10 h-10 rounded-full border border-slate-200 items-center justify-center text-slate-400">
          <span className="text-sm font-bold">$</span>
        </div>

      <motion.section
        style={{ opacity, scale }}
        className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
      >
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          className="lg:col-span-6 space-y-7"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700">Your AI money manager, inside {meta.label}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] text-slate-900">
            Your AI Money
            <br />
            Manager. Inside
            <br />
            <AnimatePresence mode="wait">
              <motion.span
                key={`hero-word-${channel}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className={`inline-block bg-gradient-to-r ${meta.heroGrad} bg-clip-text text-transparent`}
              >
                {meta.label}.
              </motion.span>
            </AnimatePresence>
          </h1>

          <p className="text-slate-600 text-lg max-w-lg font-normal leading-relaxed">
            Track spending, organize your transactions, and manage your money — all through chat.
          </p>

          {/* CTA row */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href={`/register?plan=free&channel=${channel}&type=direct`}
              prefetch={false}
              className={`pl-7 pr-2 py-2 rounded-full font-bold text-sm bg-gradient-to-r ${meta.from} ${meta.via} ${meta.to} text-slate-950 transition-all shadow-xl ${meta.glow} flex items-center gap-3 group`}
            >
              <span>Start Free on {meta.label} 🚀</span>
              <span className="w-9 h-9 rounded-full bg-slate-950/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> Unlimited Free Text Logging
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
            <span>Also available on</span>
            <button
              type="button"
              onClick={() => setChannel(channel === "whatsapp" ? "telegram" : "whatsapp")}
              className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 transition-colors underline decoration-dotted underline-offset-4"
            >
              {React.createElement(CHANNEL_META[channel === "whatsapp" ? "telegram" : "whatsapp"].icon, { className: "w-3.5 h-3.5" })}
              {CHANNEL_META[channel === "whatsapp" ? "telegram" : "whatsapp"].label}
            </button>
          </div>
        </motion.div>

        {/* Phone Mockup — tilted 3D device showing the app's home
            dashboard (balance, monthly overview, top categories), with
            WhatsApp / Telegram / AI bubbles floating around it, echoing
            the reference screenshot. Chrome and accents still swap with
            the active channel so the preview stays true to the product. */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          onMouseMove={handlePhoneMouseMove}
          onMouseLeave={handlePhoneMouseLeave}
          className="lg:col-span-6 relative flex justify-center items-center min-h-[520px] sm:min-h-[620px]"
          style={{ perspective: "1400px" }}
        >
          {/* Soft ambient glow behind the phone */}
          <div
            className={`absolute w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] rounded-full blur-[110px] opacity-30 bg-gradient-to-br ${meta.from} ${meta.to} transition-colors duration-500`}
          />

          {/* Grounding shadow beneath the phone */}
          <div className="absolute bottom-4 sm:bottom-9 w-[190px] h-[26px] rounded-full bg-black/70 blur-2xl opacity-60" />

          {/* Phone frame, tilted for depth and following the cursor */}
          <motion.div
            className="relative z-10"
            style={{
              transformStyle: "preserve-3d",
              rotateX: springRotateX,
              rotateY: springRotateY,
              rotateZ: -3,
            }}
          >
            <div
              className={`w-[min(300px,82vw)] sm:w-[330px] rounded-[2.75rem] border-[6px] border-slate-800 bg-slate-950 shadow-2xl transition-colors duration-500 ${meta.glow}`}
            >
              {/* Dynamic island / notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-950 rounded-b-2xl z-30" />

              <div className="relative rounded-[2.25rem] overflow-hidden bg-white">
                {/* Chat header */}
                <div className="flex items-center gap-2.5 px-4 pt-8 pb-3 border-b border-slate-100">
                  <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${meta.from} ${meta.to}`}>
                    <ChannelIcon className="w-4 h-4 text-slate-950" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-900 truncate">
                      <span>BroFInAi</span>
                      <CheckCircle2 className="w-3 h-3 text-sky-500 fill-sky-500/20" />
                    </div>
                    <div className="text-[9px] text-emerald-600">online</div>
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                {/* Chat body — swaps accent color with the active channel */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`chat-${channel}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="px-3.5 pt-3.5 pb-3 space-y-2.5 font-sans bg-slate-50"
                  >
                    {/* User message bubble */}
                    <div className="flex justify-end">
                      <div className={`max-w-[82%] rounded-2xl rounded-tr-sm px-3 py-2 bg-gradient-to-br ${meta.from} ${meta.to} text-[10.5px] font-semibold text-slate-950`}>
                        How much did I spend this week?
                      </div>
                    </div>

                    {/* Bot reply bubble */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2 bg-white border border-slate-200 text-[10.5px] text-slate-700 shadow-sm">
                        You spent <span className="font-bold text-slate-900">$96.50</span> on food this week.
                      </div>
                    </div>

                    {/* Weekly spend card */}
                    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-3.5 mt-1">
                      <div className="text-[9px] text-slate-500">This Week</div>
                      <div className="text-lg font-black text-slate-900 mt-0.5">$1,260.00</div>
                      <div className="flex items-end justify-between gap-1.5 h-14 mt-3">
                        {[
                          { d: "Mon", h: 22 },
                          { d: "Tue", h: 30 },
                          { d: "Wed", h: 26 },
                          { d: "Thu", h: 100, active: true },
                          { d: "Fri", h: 34 },
                          { d: "Sat", h: 20 },
                          { d: "Sun", h: 16 },
                        ].map((bar) => (
                          <div key={bar.d} className="flex-1 h-full flex items-end">
                            <div
                              className={`w-full rounded-md ${bar.active ? `bg-gradient-to-t ${meta.from} ${meta.to}` : "bg-slate-100"}`}
                              style={{ height: `${bar.h}%` }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between gap-1.5 mt-1.5">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                          <span key={d} className={`flex-1 text-center text-[7px] ${d === "Thu" ? "text-slate-900 font-bold" : "text-slate-400"}`}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Category breakdown */}
                    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-3.5 space-y-2.5">
                      {[
                        { icon: Utensils, label: "Food & Dining", amount: "$96.50", bg: "bg-sky-100", text: "text-sky-600" },
                        { icon: Car, label: "Transport", amount: "$45.20", bg: "bg-emerald-100", text: "text-emerald-600" },
                        { icon: ShoppingBag, label: "Shopping", amount: "$120.00", bg: "bg-violet-100", text: "text-violet-600" },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${row.bg} ${row.text}`}>
                              <row.icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10.5px] text-slate-700 truncate">{row.label}</span>
                          </div>
                          <span className="text-[10.5px] font-bold text-slate-900 shrink-0">{row.amount}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Message input */}
                <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 bg-white">
                  <div className="flex-1 rounded-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-[10px] text-slate-400">
                    Message
                  </div>
                  <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${meta.from} ${meta.to}`}>
                    <Mic className="w-3.5 h-3.5 text-slate-950" />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>
      </div>

      {/* TRUST BAR — reads as a global, enterprise-credible pitch: the
          infrastructure and channels BroFInAi is genuinely built on
          (Supabase, WhatsApp, Telegram) sit alongside the standards its
          stack meets, so the row is honest rather than a fake client list. */}
      <section className="relative border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-7">
            Trusted infrastructure &amp; global-standard security
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-80">
            {[
              { icon: ShieldCheck, label: "Bank-grade Encryption" },
              { icon: WhatsAppIcon, label: "WhatsApp Business" },
              { icon: TelegramIcon, label: "Telegram Verified Bot" },
              { icon: Zap, label: "Supabase Cloud" },
              { icon: Lock, label: "GDPR-minded Privacy" },
              { icon: Activity, label: "99.9% Uptime" },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-2 text-slate-500 grayscale hover:grayscale-0 hover:text-slate-700 transition">
                <t.icon className="w-4 h-4" />
                <span className="text-sm font-semibold tracking-tight whitespace-nowrap">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION — asymmetric product showcase. The left panel is a
          live, channel-aware chat mockup (follows the same `channel` state
          as the rest of the page) plus the dashboard/export card; the right
          stack demonstrates voice and receipt OCR. Only real, shipped
          capabilities. Background carries a light skyline + global-network
          motif with floating currency badges. */}
      <section id="features" className="scroll-mt-24 relative overflow-hidden">
        {/* Ambient background — skyline silhouettes + global network + glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/4 w-[520px] h-[520px] rounded-full bg-emerald-50 blur-[140px]" />
          <div className="absolute top-1/3 -right-20 w-[480px] h-[480px] rounded-full bg-cyan-50 blur-[140px]" />

          {/* Skyline silhouettes framing the section, left and right */}
          <div className="hidden lg:flex absolute bottom-0 left-0 items-end gap-1.5 opacity-[0.06] h-[70%]">
            {[30, 55, 42, 80, 38, 65, 48, 90, 34, 58].map((h, i) => (
              <div key={i} className="w-6 bg-slate-900 rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="hidden lg:flex absolute bottom-0 right-0 items-end gap-1.5 opacity-[0.06] h-[70%]">
            {[48, 88, 32, 60, 40, 76, 30, 54, 44, 68].map((h, i) => (
              <div key={i} className="w-6 bg-slate-900 rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>

          {/* Global network — dotted world texture with connecting arcs */}
          <svg
            className="hidden md:block absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-[420px] opacity-[0.35]"
            viewBox="0 0 1200 420"
            fill="none"
          >
            {Array.from({ length: 14 }).map((_, row) =>
              Array.from({ length: 40 }).map((_, col) => {
                const seed = (row * 40 + col) % 7;
                if (seed === 0 || seed === 3) return null;
                return (
                  <circle
                    key={`${row}-${col}`}
                    cx={col * 31 + (row % 2) * 15}
                    cy={row * 32}
                    r={1.1}
                    fill="#10b981"
                  />
                );
              })
            )}
            <motion.path
              d="M120 210 C 350 60, 550 340, 780 160 S 1050 90, 1150 200"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="2 7"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2 }}
            />
            <circle cx="120" cy="210" r="4" fill="#10b981" />
            <circle cx="780" cy="160" r="4" fill="#10b981" />
            <circle cx="1150" cy="200" r="4" fill="#10b981" />
          </svg>

          {/* Floating currency badges */}
          {[
            { symbol: "$", top: "10%", left: "6%", delay: 0 },
            { symbol: "¥", top: "62%", left: "3%", delay: 0.5 },
            { symbol: "€", top: "16%", left: "92%", delay: 0.9 },
            { symbol: "£", top: "58%", left: "94%", delay: 1.3 },
          ].map((c) => (
            <motion.div
              key={c.symbol}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: c.delay }}
              className="hidden lg:flex absolute w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-md items-center justify-center text-amber-700 font-black text-lg"
              style={{ top: c.top, left: c.left }}
            >
              {c.symbol}
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative max-w-7xl mx-auto px-6 py-28 border-t border-slate-200"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">
              <Sparkles className="w-3.5 h-3.5" /> Core Features
            </div>
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

          <div className="relative">
            {/* Animated running-highlight border — a light comet travels
                around the card's edge on a continuous loop. */}
            <motion.div
              variants={fadeInUp}
              className="relative rounded-[32px] p-[2.5px] overflow-hidden shadow-2xl shadow-emerald-500/10 bg-white/50"
            >
              <motion.div
                className="absolute inset-[-150%]"
                style={{
                  background: channel === "telegram"
                    ? "conic-gradient(from 0deg, transparent 0%, transparent 76%, #7dd3fc 84%, #2563eb 90%, transparent 98%)"
                    : "conic-gradient(from 0deg, transparent 0%, transparent 76%, #6ee7b7 84%, #0891b2 90%, transparent 98%)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              />

              <div className={`relative rounded-[30.5px] overflow-hidden bg-gradient-to-br transition-colors duration-500 ${channel === "telegram" ? "from-sky-200 via-slate-400 to-blue-300" : "from-emerald-200 via-slate-400 to-teal-300"}`}>
                <div className="relative p-6 sm:p-10 lg:p-14">
                  {/* decorative color blobs — soft floating bubbles that fill
                      the frame with atmosphere, echoing a glassy hero mockup.
                      Colors follow the active channel: green/teal for
                      WhatsApp, sky/blue for Telegram. */}
                  {[
                    { pos: "-top-20 -left-20", size: "w-80 h-80", blur: "blur-2xl" },
                    { pos: "-bottom-24 -right-16", size: "w-96 h-96", blur: "blur-2xl" },
                    { pos: "top-6 right-[16%]", size: "w-48 h-48", blur: "blur-2xl" },
                    { pos: "bottom-10 left-[20%]", size: "w-40 h-40", blur: "blur-2xl" },
                    { pos: "top-1/3 left-[6%]", size: "w-28 h-28", blur: "blur-xl" },
                    { pos: "bottom-1/4 right-[8%]", size: "w-32 h-32", blur: "blur-xl" },
                    { pos: "top-[8%] right-[32%]", size: "w-16 h-16", blur: "blur-lg" },
                    { pos: "bottom-[16%] right-[28%]", size: "w-24 h-24", blur: "blur-xl" },
                    { pos: "top-[55%] right-[4%]", size: "w-44 h-44", blur: "blur-2xl" },
                    { pos: "top-[2%] left-[38%]", size: "w-20 h-20", blur: "blur-xl" },
                    { pos: "bottom-[4%] left-[42%]", size: "w-14 h-14", blur: "blur-lg" },
                    { pos: "top-[42%] left-[30%]", size: "w-10 h-10", blur: "blur-md", hide: "hidden sm:block" },
                    { pos: "top-[20%] left-[48%]", size: "w-12 h-12", blur: "blur-md", hide: "hidden sm:block" },
                    { pos: "bottom-[30%] right-[38%]", size: "w-16 h-16", blur: "blur-lg", hide: "hidden lg:block" },
                    { pos: "top-[70%] left-[10%]", size: "w-16 h-16", blur: "blur-lg", hide: "hidden lg:block" },
                  ].map((c, i) => {
                    const waColors = ["bg-emerald-400/60", "bg-teal-500/50", "bg-lime-300/60", "bg-emerald-500/55", "bg-teal-400/55", "bg-cyan-400/50", "bg-emerald-600/55", "bg-teal-500/45", "bg-cyan-300/60", "bg-emerald-500/55", "bg-lime-200/60", "bg-teal-300/55", "bg-cyan-400/50", "bg-emerald-500/50", "bg-teal-600/40"];
                    const tgColors = ["bg-sky-400/60", "bg-blue-500/50", "bg-cyan-300/60", "bg-sky-500/55", "bg-blue-400/55", "bg-cyan-400/50", "bg-sky-600/55", "bg-blue-500/45", "bg-cyan-300/60", "bg-sky-500/55", "bg-blue-200/60", "bg-sky-300/55", "bg-cyan-400/50", "bg-sky-500/50", "bg-blue-600/40"];
                    const color = (channel === "telegram" ? tgColors : waColors)[i];
                    return (
                      <div
                        key={i}
                        className={`pointer-events-none absolute ${c.pos} ${c.size} rounded-full ${color} ${c.blur} ${c.hide ?? ""} transition-colors duration-500`}
                      />
                    );
                  })}
                  <div className="pointer-events-none absolute top-[14%] left-[14%] w-8 h-8 rounded-full bg-white/75 blur-sm hidden lg:block" />
                  <div className="pointer-events-none absolute bottom-[10%] right-[46%] w-8 h-8 rounded-full bg-white/75 blur-sm hidden lg:block" />
                  {/* faint criss-crossing light streaks for extra depth */}
                  <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
                    <line x1="15%" y1="100%" x2="75%" y2="10%" stroke="url(#gridBgStreak1)" strokeWidth="1.5" />
                    <line x1="60%" y1="100%" x2="95%" y2="0%" stroke="url(#gridBgStreak2)" strokeWidth="1.5" />
                    <defs>
                      <linearGradient id="gridBgStreak1" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor={channel === "telegram" ? "#38bdf8" : "#34d399"} stopOpacity="0" />
                        <stop offset="50%" stopColor={channel === "telegram" ? "#38bdf8" : "#34d399"} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={channel === "telegram" ? "#38bdf8" : "#34d399"} stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="gridBgStreak2" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor={channel === "telegram" ? "#60a5fa" : "#2dd4bf"} stopOpacity="0" />
                        <stop offset="50%" stopColor={channel === "telegram" ? "#60a5fa" : "#2dd4bf"} stopOpacity="0.7" />
                        <stop offset="100%" stopColor={channel === "telegram" ? "#60a5fa" : "#2dd4bf"} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* soft glass veil so foreground text/cards stay legible over the busier orb background */}
                  <div className="pointer-events-none absolute inset-0 bg-white/10" />

                  {/* header row */}
                  <div className="relative flex items-center justify-between flex-wrap gap-3 mb-5 sm:mb-6">
                    <div className={`flex items-center gap-2 ${meta.text} text-sm font-bold uppercase tracking-widest bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors duration-500`}>
                      <MessageSquare className="w-5 h-5" />
                      AI-Powered Omni-Channel Logging
                    </div>
                    <ChannelSwitch channel={channel} onChange={setChannel} layoutId="features-chat-pill" />
                  </div>

                  {/* Phone mockup with feature chips stacked in two balanced
                      columns — Voice + Daily Summary on the left, Dashboard
                      & Export + Receipt OCR on the right, phone centered. */}
                  <div className="relative flex items-center justify-center py-1 min-h-[420px] sm:min-h-[520px] lg:min-h-[580px]">
                    {/* LEFT STACK — Track by Voice (top) + Daily Summary (bottom) */}
                    <div className="hidden md:flex flex-col justify-center gap-5 lg:gap-6 absolute left-0 top-0 bottom-0 lg:left-2 w-64 lg:w-80 z-10 py-1">
                      {/* VOICE */}
                      <motion.div
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        whileHover={{ y: -3 }}
                        className={`p-5 lg:p-6 rounded-2xl bg-white border-2 shadow-lg transition-colors duration-500 ${channel === "telegram" ? "border-sky-200/70 shadow-sky-500/10" : "border-orange-200/70 shadow-orange-500/10"}`}
                      >
                        <div className="flex items-center gap-3.5 mb-4">
                          <div className={`w-12 h-12 lg:w-14 lg:h-14 shrink-0 rounded-xl flex items-center justify-center transition-colors duration-500 ${channel === "telegram" ? "bg-sky-50 text-sky-600" : "bg-orange-50 text-orange-600"}`}>
                            <Mic className="w-6 h-6" />
                          </div>
                          <h3 className="font-bold text-base text-slate-900">Track by Voice</h3>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4 flex items-center gap-3">
                          <div className="flex items-end gap-[3.5px] h-6">
                            {[4, 9, 6, 13, 7, 10, 5, 8, 4].map((h, i) => (
                              <span key={i} className={`w-[3.5px] rounded-full transition-colors duration-500 ${channel === "telegram" ? "bg-sky-400/70" : "bg-orange-400/70"}`} style={{ height: `${h * 1.5}px` }} />
                            ))}
                          </div>
                          <span className={`ml-auto text-base font-semibold flex items-center gap-1.5 transition-colors duration-500 ${channel === "telegram" ? "text-sky-600" : "text-emerald-600"}`}>
                            Groceries · $18 <Check className="w-4 h-4" />
                          </span>
                        </div>
                      </motion.div>

                      {/* DAILY SUMMARY */}
                      <motion.div
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        whileHover={{ y: -3 }}
                        className={`p-5 lg:p-6 rounded-2xl bg-white border-2 shadow-lg transition-colors duration-500 ${channel === "telegram" ? "border-blue-200/70 shadow-blue-500/10" : "border-teal-200/70 shadow-teal-500/10"}`}
                      >
                        <div className="flex items-center gap-3.5 mb-4">
                          <div className={`w-12 h-12 lg:w-14 lg:h-14 shrink-0 rounded-xl flex items-center justify-center transition-colors duration-500 ${channel === "telegram" ? "bg-blue-50 text-blue-600" : "bg-teal-50 text-teal-600"}`}>
                            <Activity className="w-6 h-6" />
                          </div>
                          <h3 className="font-bold text-base text-slate-900">Daily Summary</h3>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-2.5">
                          <div className="flex items-center justify-between text-base">
                            <span className="text-slate-500">Today's spending</span>
                            <span className="font-bold text-slate-900">$86.40</span>
                          </div>
                          <div className="flex items-center justify-between text-base">
                            <span className="text-slate-500">Transactions</span>
                            <span className={`font-semibold transition-colors duration-500 ${channel === "telegram" ? "text-blue-600" : "text-teal-600"}`}>5 logged</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* RIGHT STACK — Dashboard & Export (top) + AI Receipt OCR (bottom) */}
                    <div className="hidden md:flex flex-col justify-center gap-5 lg:gap-6 absolute right-0 top-0 bottom-0 lg:right-2 w-64 lg:w-80 z-10 py-1">
                      {/* DASHBOARD */}
                      <motion.div
                        initial={{ opacity: 0, x: 12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.35 }}
                        whileHover={{ y: -3 }}
                        className={`p-5 lg:p-6 rounded-2xl bg-white border-2 shadow-lg transition-colors duration-500 ${channel === "telegram" ? "border-sky-200/70 shadow-sky-500/10" : "border-cyan-200/70 shadow-cyan-500/10"}`}
                      >
                        <div className={`flex items-center gap-2.5 text-sm font-bold uppercase tracking-widest mb-4 transition-colors duration-500 ${channel === "telegram" ? "text-sky-600" : "text-cyan-600"}`}>
                          <PieChart className="w-5 h-5" />
                          Dashboard &amp; Export
                        </div>
                        <div className="flex items-end gap-2 h-16 mb-4">
                          {[25, 42, 30, 58, 48, 100, 62].map((h, i) => (
                            <div key={i} className="flex-1 h-full flex items-end">
                              <div className={`w-full rounded-sm bg-gradient-to-t transition-colors duration-500 ${channel === "telegram" ? "from-sky-500 to-blue-400" : "from-cyan-500 to-emerald-400"}`} style={{ height: `${h}%` }} />
                            </div>
                          ))}
                        </div>
                        <div className={`flex items-center justify-center gap-2.5 py-3 rounded-lg bg-gradient-to-r text-slate-950 text-sm font-bold uppercase tracking-wider transition-colors duration-500 ${channel === "telegram" ? "from-sky-400 to-blue-400" : "from-emerald-400 to-cyan-400"}`}>
                          <Download className="w-5 h-5" />
                          Excel Export
                        </div>
                      </motion.div>

                      {/* OCR */}
                      <motion.div
                        initial={{ opacity: 0, x: 12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.65 }}
                        whileHover={{ y: -3 }}
                        className={`p-5 lg:p-6 rounded-2xl bg-white border-2 shadow-lg transition-colors duration-500 ${channel === "telegram" ? "border-indigo-200/70 shadow-indigo-500/10" : "border-purple-200/70 shadow-purple-500/10"}`}
                      >
                        <div className="flex items-center gap-3.5 mb-4">
                          <div className={`w-12 h-12 lg:w-14 lg:h-14 shrink-0 rounded-xl flex items-center justify-center transition-colors duration-500 ${channel === "telegram" ? "bg-indigo-50 text-indigo-600" : "bg-purple-50 text-purple-600"}`}>
                            <Receipt className="w-6 h-6" />
                          </div>
                          <h3 className="font-bold text-base text-slate-900">AI Receipt OCR</h3>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-4">
                          <div className="relative w-14 h-16 shrink-0 rounded-md bg-slate-900/5 border border-slate-200 overflow-hidden">
                            <div className="absolute inset-x-2 top-2.5 space-y-2">
                              <div className="h-[3px] bg-slate-900/20 rounded-full" />
                              <div className="h-[3px] bg-slate-900/15 rounded-full w-3/4" />
                              <div className="h-[3px] bg-slate-900/15 rounded-full w-full" />
                              <div className="h-[3px] bg-slate-900/15 rounded-full w-2/3" />
                            </div>
                            <motion.div
                              animate={{ top: ["10%", "90%", "10%"] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                              className={`absolute left-0 right-0 h-[2px] transition-colors duration-500 ${channel === "telegram" ? "bg-indigo-400/80 shadow-[0_0_6px] shadow-indigo-400/70" : "bg-purple-400/80 shadow-[0_0_6px] shadow-purple-400/70"}`}
                            />
                          </div>
                          <div className="text-base space-y-2 min-w-0">
                            <div className="flex gap-2">
                              <span className="text-slate-500 shrink-0">Merchant</span>
                              <span className="text-slate-900 font-semibold truncate">Cafe Nero</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-slate-500 shrink-0">Total</span>
                              <span className={`font-semibold transition-colors duration-500 ${channel === "telegram" ? "text-indigo-600" : "text-purple-600"}`}>$42.80</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* PHONE — chat window sized and framed like a real phone screen */}
                    <div className="relative z-20 w-[220px] sm:w-[250px] lg:w-[270px] aspect-[9/19] rounded-[36px] bg-slate-900 p-2 shadow-2xl">
                      {/* side buttons for phone realism */}
                      <div className="absolute -left-[2px] top-20 w-[3px] h-8 rounded-full bg-slate-700" />
                      <div className="absolute -left-[2px] top-32 w-[3px] h-12 rounded-full bg-slate-700" />
                      <div className="absolute -right-[2px] top-28 w-[3px] h-14 rounded-full bg-slate-700" />

                      <div className={`relative w-full h-full rounded-[30px] bg-slate-50 border transition-colors duration-500 ${meta.ring} overflow-hidden flex flex-col`}>
                        {/* notch */}
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3.5 rounded-full bg-slate-900 z-10" />

                        <div className="pt-6 px-3 pb-2 flex items-center justify-between border-b border-slate-200 bg-slate-900/[0.02] shrink-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center bg-slate-900/5 border border-slate-200 ${meta.text}`}>
                              <ChannelIcon className="w-3 h-3" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold text-slate-900 leading-tight truncate">BroFInAi</div>
                              <div className="text-[9px] text-slate-500 leading-tight truncate">AI Money Manager</div>
                            </div>
                          </div>
                          <span className={`flex items-center gap-1 text-[9px] font-medium shrink-0 ${meta.text}`}>
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
                            className="flex-1 p-3 flex flex-col justify-end gap-2 overflow-hidden"
                          >
                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.15 }}
                              className={`p-2 rounded-xl rounded-tr-sm max-w-[80%] ml-auto text-[11px] shadow-md border ${
                                channel === "whatsapp"
                                  ? "bg-emerald-100 border-emerald-200 text-emerald-800"
                                  : "bg-sky-100 border-sky-200 text-sky-800"
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
                              className="flex items-center gap-1 bg-slate-100 border border-slate-200 w-fit px-2.5 py-2 rounded-xl rounded-tl-sm"
                            >
                              {[0, 1, 2].map((i) => (
                                <motion.span
                                  key={i}
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                                  className="w-1 h-1 rounded-full bg-slate-400"
                                />
                              ))}
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 6 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: 0.9 }}
                              className={`p-2.5 rounded-xl rounded-tl-sm max-w-[95%] space-y-1.5 shadow-lg border ${
                                channel === "whatsapp"
                                  ? "bg-slate-100 border-slate-200 text-slate-700"
                                  : "bg-sky-50 border-sky-200 text-slate-700"
                              }`}
                            >
                              <div className={`flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider ${meta.text}`}>
                                <CheckCircle2 className="w-3 h-3" /> Expense recorded
                              </div>
                              <div className="grid grid-cols-3 gap-1 text-[9px]">
                                <div>
                                  <div className="text-slate-500 text-[8px] mb-0.5">Category</div>
                                  <div className="text-slate-900 font-semibold">Lunch</div>
                                </div>
                                <div>
                                  <div className="text-slate-500 text-[8px] mb-0.5">Amount</div>
                                  <div className="text-slate-900 font-semibold">$25</div>
                                </div>
                                <div>
                                  <div className="text-slate-500 text-[8px] mb-0.5">Status</div>
                                  <div className={`font-semibold ${meta.text}`}>Added</div>
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* mobile-only stacked feature row — the absolute floating
                      chips are hidden below md, so the same four features
                      reappear here as a simple stacked list. */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden mt-6">
                    <div className={`p-3.5 rounded-2xl bg-white border-2 shadow-lg transition-colors duration-500 ${channel === "telegram" ? "border-sky-200/70 shadow-sky-500/10" : "border-orange-200/70 shadow-orange-500/10"}`}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-colors duration-500 ${channel === "telegram" ? "bg-sky-50 text-sky-600" : "bg-orange-50 text-orange-600"}`}>
                          <Mic className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-xs text-slate-900">Track by Voice</h3>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Send a voice note and AI logs the expense.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl bg-white border-2 shadow-lg transition-colors duration-500 ${channel === "telegram" ? "border-blue-200/70 shadow-blue-500/10" : "border-teal-200/70 shadow-teal-500/10"}`}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-colors duration-500 ${channel === "telegram" ? "bg-blue-50 text-blue-600" : "bg-teal-50 text-teal-600"}`}>
                          <Activity className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-xs text-slate-900">Daily Summary</h3>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">A quick daily rollup of what you spent.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl bg-white border-2 shadow-lg transition-colors duration-500 ${channel === "telegram" ? "border-sky-200/70 shadow-sky-500/10" : "border-cyan-200/70 shadow-cyan-500/10"}`}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-colors duration-500 ${channel === "telegram" ? "bg-sky-50 text-sky-600" : "bg-cyan-50 text-cyan-600"}`}>
                          <PieChart className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-xs text-slate-900">Dashboard &amp; Export</h3>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">See spending trends and export to Excel.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl bg-white border-2 shadow-lg transition-colors duration-500 ${channel === "telegram" ? "border-indigo-200/70 shadow-indigo-500/10" : "border-purple-200/70 shadow-purple-500/10"}`}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-colors duration-500 ${channel === "telegram" ? "bg-indigo-50 text-indigo-600" : "bg-purple-50 text-purple-600"}`}>
                          <Receipt className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-xs text-slate-900">AI Receipt OCR</h3>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Snap a receipt and AI extracts every detail.</p>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 1.1 }}
                    className="relative flex items-center gap-2 text-xs text-slate-500 mt-6"
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 transition-colors duration-500 ${channel === "telegram" ? "text-sky-600" : "text-emerald-600"}`} />
                    Transaction synced to dashboard
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* LANGUAGE & VOICE — multilingual voice + text logging is the single
          biggest differentiator against every English-only expense bot, so
          it gets its own dedicated moment instead of being buried inside
          the features grid. */}
      <section id="language" className="scroll-mt-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* soft camera-flare glow, brightest at the top-left like the reference */}
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-white blur-[120px]" />
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-sky-100/70 blur-[150px]" />
          <div className="absolute bottom-0 left-1/4 w-[460px] h-[460px] rounded-full bg-emerald-50 blur-[140px]" />
          <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full bg-slate-300/40 blur-[130px]" />

          {/* faint neural-network line grid, echoing the reference art's
              circuit/constellation lines in the corners */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.35]" preserveAspectRatio="none">
            <g stroke="#94a3b8" strokeWidth="1" fill="none">
              <path d="M -20 40 L 120 110 L 260 60 L 380 140" />
              <path d="M 60 180 L 180 130 L 320 200 L 420 120" />
              <path d="M 20 20 L 90 90" />
              <path d="M 260 60 L 300 10" />
              <path d="M 1100 30 L 1250 100 L 1400 50" />
              <path d="M 1180 140 L 1300 90 L 1420 170" />
              <path d="M 1250 100 L 1260 200" />
              <path d="M 40 520 L 160 460 L 260 540 L 380 480" />
              <path d="M 120 460 L 100 380" />
              <path d="M 1050 500 L 1180 440 L 1300 520 L 1400 460" />
              <path d="M 1180 440 L 1200 360" />
            </g>
            <g fill="#7dd3fc">
              <circle cx="120" cy="110" r="2.5" />
              <circle cx="260" cy="60" r="2" />
              <circle cx="180" cy="130" r="2" />
              <circle cx="1250" cy="100" r="2.5" />
              <circle cx="1300" cy="90" r="2" />
              <circle cx="160" cy="460" r="2.5" />
              <circle cx="1180" cy="440" r="2.5" />
            </g>
          </svg>

          {/* colorful bokeh dots scattered like the reference, varying size/blur/color */}
          <div className="absolute top-[10%] left-[6%] w-4 h-4 rounded-full bg-cyan-300/70 blur-[3px]" />
          <div className="absolute top-[18%] left-[16%] w-2.5 h-2.5 rounded-full bg-teal-300/60 blur-[2px]" />
          <div className="absolute top-[6%] left-[24%] w-1.5 h-1.5 rounded-full bg-white/90 blur-[1px]" />
          <div className="absolute top-[26%] left-[9%] w-2 h-2 rounded-full bg-pink-200/70 blur-[2px]" />
          <div className="absolute top-[8%] right-[10%] w-3.5 h-3.5 rounded-full bg-sky-300/70 blur-[3px]" />
          <div className="absolute top-[16%] right-[20%] w-2 h-2 rounded-full bg-cyan-200/60 blur-[2px]" />
          <div className="absolute top-[28%] right-[6%] w-2.5 h-2.5 rounded-full bg-pink-200/60 blur-[2px]" />
          <div className="absolute top-[4%] right-[30%] w-1.5 h-1.5 rounded-full bg-white/90 blur-[1px]" />
          <div className="absolute bottom-[20%] left-[10%] w-3 h-3 rounded-full bg-emerald-300/60 blur-[2px]" />
          <div className="absolute bottom-[10%] left-[22%] w-2 h-2 rounded-full bg-cyan-200/60 blur-[2px]" />
          <div className="absolute bottom-[30%] left-[4%] w-1.5 h-1.5 rounded-full bg-teal-200/60 blur-[1px]" />
          <div className="absolute bottom-[16%] right-[12%] w-3 h-3 rounded-full bg-cyan-300/60 blur-[2px]" />
          <div className="absolute bottom-[8%] right-[24%] w-2 h-2 rounded-full bg-sky-200/60 blur-[2px]" />
          <div className="absolute bottom-[26%] right-[4%] w-2.5 h-2.5 rounded-full bg-pink-200/60 blur-[2px]" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative max-w-7xl mx-auto px-6 py-28 border-t border-slate-200"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-14 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/5 border border-slate-200 text-xs font-bold uppercase tracking-[0.25em] text-sky-600">
              <Languages className="w-3.5 h-3.5" /> Speak Any Language
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Speak Naturally.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                BroFinAI Understands.
              </span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
              Type or talk in whatever language feels natural — our AI understands the context, currency, and category no matter how you phrase it.
            </p>

            {/* Language chips */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {[
                { label: "English", dot: "bg-emerald-400", active: true },
                { label: "Sinhala", dot: "bg-sky-400", active: false },
                { label: "Tamil", dot: "bg-amber-400", active: false },
              ].map((lang) => (
                <motion.span
                  key={lang.label}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className={
                    lang.active
                      ? "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/70 backdrop-blur-sm border border-slate-200 text-slate-600 shadow-sm hover:border-slate-300 transition-colors"
                  }
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${lang.active ? "bg-slate-950/70" : lang.dot}`} />
                  {lang.label}
                </motion.span>
              ))}
              <motion.span
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold text-slate-500 border border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-700 transition-colors"
              >
                <Plus className="w-3 h-3" /> More
              </motion.span>
            </div>
          </motion.div>

          {/* Voice-to-dashboard flow */}
          <motion.div variants={fadeInUp} className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Voice bar — dark glass pill with a pulsing mic, live transcript, and an animated waveform */}
              <div className="relative">
                {/* ambient colored glow floating beneath the card */}
                <div className="pointer-events-none absolute -inset-6 rounded-[999px] bg-gradient-to-r from-teal-400/30 via-cyan-400/30 to-sky-400/30 blur-3xl" />

                <div className="relative rounded-[36px] sm:rounded-[999px] p-[1.5px] bg-gradient-to-r from-teal-300/80 via-cyan-300/60 to-sky-400/80 shadow-2xl shadow-cyan-500/20">
                  <div className="relative rounded-[34px] sm:rounded-[999px] bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 px-5 py-5 sm:px-7 sm:py-6 flex items-center gap-4 overflow-hidden">
                    {/* glass sheen across the top */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent" />
                    {/* drifting color blobs for depth */}
                    <div className="pointer-events-none absolute -top-12 -left-8 w-44 h-44 rounded-full bg-teal-400/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-12 right-1/4 w-40 h-40 rounded-full bg-sky-400/20 blur-3xl" />

                    {/* mic circle with pulsing rings + live indicator */}
                    <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
                      {[0, 1].map((ring) => (
                        <motion.span
                          key={ring}
                          className="absolute inset-0 rounded-full border border-cyan-300/60"
                          animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: ring * 1.1 }}
                        />
                      ))}
                      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-slate-900 to-teal-950 border-2 border-cyan-300/70 flex items-center justify-center shadow-[0_0_20px_4px_rgba(45,212,191,0.35)]">
                        <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-300" />
                      </div>
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-400 border-2 border-slate-950 animate-pulse" />
                    </div>

                    {/* transcript chip with a blinking cursor for a "live" feel */}
                    <div className="relative z-10 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-sm shrink-0 max-w-[58%] sm:max-w-none flex items-center gap-1">
                      <span className="font-mono text-[11px] sm:text-sm text-white leading-snug">Spent $850 on lunch today.</span>
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                        className="inline-block w-[2px] h-3.5 sm:h-4 bg-cyan-300 rounded-full"
                      />
                    </div>

                    {/* animated waveform, fading out toward the right edge */}
                    <div className="relative z-10 hidden sm:flex items-end gap-[3px] h-9 flex-1 justify-end [mask-image:linear-gradient(to_right,black_70%,transparent_100%)]">
                      {[10, 22, 14, 30, 40, 20, 34, 44, 26, 36, 46, 24, 32, 18, 12, 8].map((h, i) => (
                        <motion.span
                          key={i}
                          className="w-[3px] rounded-full bg-gradient-to-t from-cyan-300/70 to-white"
                          animate={{ height: [`${h * 0.4}px`, `${h}px`, `${h * 0.4}px`] }}
                          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* connector stems + scattered feature icons, echoing the
                  reference art's converging-lines layout */}
              <div className="relative mt-14 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
                {[
                  { icon: Brain, label: "AI Understands", desc: "Any language, any phrasing", accent: "purple" },
                  { icon: Utensils, label: "Categorizes", desc: "Food & Dining, auto-tagged", accent: "amber" },
                  { icon: Clock, label: "Records", desc: "Saved in a split second", accent: "sky" },
                  { icon: BarChart3, label: "Updates Dashboard", desc: "Totals refresh instantly", accent: "emerald" },
                ].map((step, i) => {
                  const ACCENTS: Record<string, { text: string; ring: string; glow: string; dot: string }> = {
                    purple: { text: "text-purple-600", ring: "from-purple-200 via-purple-100 to-white", glow: "shadow-purple-500/20", dot: "bg-purple-400" },
                    amber: { text: "text-amber-600", ring: "from-amber-200 via-amber-100 to-white", glow: "shadow-amber-500/20", dot: "bg-amber-400" },
                    sky: { text: "text-sky-600", ring: "from-sky-200 via-sky-100 to-white", glow: "shadow-sky-500/20", dot: "bg-sky-400" },
                    emerald: { text: "text-emerald-600", ring: "from-emerald-200 via-emerald-100 to-white", glow: "shadow-emerald-500/20", dot: "bg-emerald-400" },
                  };
                  const a = ACCENTS[step.accent];
                  return (
                    <motion.div
                      key={step.label}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className={`relative flex flex-col items-center text-center gap-3 ${i === 0 || i === 3 ? "md:-translate-y-10" : "md:translate-y-4"}`}
                    >
                      {/* connector line with a dot pulsing down from the voice bar */}
                      <span className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 w-px h-6 sm:h-8 bg-gradient-to-b from-transparent via-slate-300 to-slate-300 overflow-visible">
                        <motion.span
                          className={`absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${a.dot}`}
                          animate={{ top: ["0%", "100%"], opacity: [0, 1, 0] }}
                          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                        />
                      </span>

                      <div className={`relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl p-[1.5px] bg-gradient-to-br ${a.ring} shadow-lg ${a.glow}`}>
                        <div className="w-full h-full rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center">
                          <step.icon className={`w-5 h-5 sm:w-[22px] sm:h-[22px] ${a.text}`} strokeWidth={2} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900">{step.label}</div>
                        <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">{step.desc}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* HOW IT WORKS — a connected onboarding journey (register → connect →
          manage), not three generic cards. Channel choice is de-emphasized
          here (no big toggle) but Step 02's preview still quietly follows
          the shared `channel` state so WhatsApp and Telegram both feel at
          home in the flow. */}
      <section id="how-it-works" className="scroll-mt-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-1/3 w-[480px] h-[480px] rounded-full bg-emerald-50 blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-cyan-50 blur-[140px]" />
          <div className="absolute top-1/2 left-10 w-[300px] h-[300px] rounded-full bg-purple-500/[0.06] blur-[120px]" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative max-w-7xl mx-auto px-6 py-28 border-t border-slate-200"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Step-by-Step
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">How It Works</h2>
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
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group relative rounded-[30px] p-[1.5px] bg-gradient-to-br from-purple-200 via-slate-200 to-white shadow-xl shadow-purple-500/[0.06] hover:shadow-purple-500/[0.12] transition-shadow duration-300"
            >
              <div className="relative h-full rounded-[29px] bg-white overflow-hidden p-8 space-y-5">
                <span className="absolute top-0 left-8 right-8 h-[3px] rounded-full bg-gradient-to-r from-purple-400 to-purple-200" />
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-purple-500/[0.05] to-transparent" />

                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-300 flex flex-col items-center justify-center gap-0.5 transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-purple-500/25">
                    <span className="text-[9px] font-black tracking-widest text-white/70">01</span>
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Step 01</div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Create Your Account</h3>
                  </div>
                </div>

                <p className="relative text-slate-600 text-sm leading-relaxed">
                  Register in seconds and get your BroFInAi account ready.
                </p>

                {/* Mini registration preview */}
                <div className="relative rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 rounded-lg bg-slate-900/5 border border-slate-200 px-3 py-2">
                    <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-[11px] text-slate-600">Name</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-900/5 border border-slate-200 px-3 py-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-[11px] text-slate-600">Email</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-900/5 border border-slate-200 px-3 py-2">
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-[11px] text-slate-600">Password</span>
                  </div>
                  <div className="w-full text-center rounded-lg bg-gradient-to-r from-purple-400/90 to-purple-300/90 text-slate-950 text-[11px] font-bold py-2 mt-1">
                    Create Account
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold pt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Account ready
                  </div>
                </div>

                <Link
                  href="/register"
                  prefetch={false}
                  className="relative inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors group/link"
                >
                  Register Free
                  <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* STEP 02 — Connect & Start Tracking */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group relative rounded-[30px] p-[1.5px] bg-gradient-to-br from-emerald-200 via-slate-200 to-white shadow-xl shadow-emerald-500/[0.06] hover:shadow-emerald-500/[0.12] transition-shadow duration-300"
            >
              <div className="relative h-full rounded-[29px] bg-white overflow-hidden p-8 space-y-5">
                <span className="absolute top-0 left-8 right-8 h-[3px] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-200" />
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-emerald-500/[0.05] to-transparent" />

                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-300 flex flex-col items-center justify-center gap-0.5 transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-emerald-500/25">
                    <span className="text-[9px] font-black tracking-widest text-white/70">02</span>
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Step 02</div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Connect & Start Tracking</h3>
                  </div>
                </div>

                <p className="relative text-slate-600 text-sm leading-relaxed">
                  Connect WhatsApp and send a text, voice note, or receipt.
                </p>

              {/* Mini chat preview — quietly follows the active channel, kept light for contrast */}
              <div className={`relative rounded-2xl bg-slate-50 border transition-colors duration-500 ${meta.ring} overflow-hidden`}>
                <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 bg-slate-900/[0.02]">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-slate-900/5 ${meta.text}`}>
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
                        ? "bg-emerald-100 border-emerald-200 text-emerald-800"
                        : "bg-sky-100 border-sky-200 text-sky-800"
                    }`}
                  >
                    Spent $15 on groceries
                  </div>
                  <div className="bg-slate-100 border border-slate-200 text-slate-700 p-3 rounded-2xl rounded-tl-sm max-w-[85%] space-y-1 shadow-lg">
                    <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Added
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Groceries — <b className="text-slate-900">$15</b>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-3.5 pb-3 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-900/5 border border-slate-200 rounded-full px-2.5 py-1">
                    <Mic className="w-3 h-3" /> Voice
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-900/5 border border-slate-200 rounded-full px-2.5 py-1">
                    <Receipt className="w-3 h-3" /> Receipt
                  </span>
                </div>
              </div>
            </div>
            </motion.div>

            {/* STEP 03 — See Your Money Clearly */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="group relative rounded-[30px] p-[1.5px] bg-gradient-to-br from-cyan-200 via-slate-200 to-white shadow-xl shadow-cyan-500/[0.06] hover:shadow-cyan-500/[0.12] transition-shadow duration-300"
            >
              <div className="relative h-full rounded-[29px] bg-white overflow-hidden p-8 space-y-5">
                <span className="absolute top-0 left-8 right-8 h-[3px] rounded-full bg-gradient-to-r from-cyan-400 to-cyan-200" />
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-cyan-500/[0.05] to-transparent" />

                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-300 flex flex-col items-center justify-center gap-0.5 transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-cyan-500/25">
                    <span className="text-[9px] font-black tracking-widest text-white/70">03</span>
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Step 03</div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">See Your Money Clearly</h3>
                  </div>
                </div>

                <p className="relative text-slate-600 text-sm leading-relaxed">
                  Your transactions sync to your dashboard so you can review and manage everything.
                </p>

                {/* Mini dashboard preview */}
                <div className="relative rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Monthly Spending</span>
                  <span className="text-sm font-bold text-slate-900">$428.50</span>
                </div>

                <div className="space-y-1.5">
                  {[
                    { label: "Food", value: "$180", pct: 42, color: "from-cyan-400 to-emerald-400" },
                    { label: "Transport", value: "$92", pct: 21, color: "from-cyan-400/80 to-emerald-400/80" },
                    { label: "Other", value: "$156.50", pct: 37, color: "from-cyan-400/60 to-emerald-400/60" },
                  ].map((row) => (
                    <div key={row.label} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-600">{row.label}</span>
                        <span className="text-slate-600 font-semibold">{row.value}</span>
                      </div>
                      <div className="h-1 rounded-full bg-slate-900/5 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${row.color}`} style={{ width: `${row.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-500">Full report</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-600">
                    <Download className="w-3 h-3" /> Export .xlsx
                  </span>
                </div>
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
          className="max-w-7xl mx-auto px-6 py-28 border-t border-slate-200"
        >
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-600 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              Plans That Fit How You Use BroFInAi
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">
              Choose How You Want to Track
            </h2>
            <p className="text-slate-600 text-sm md:text-base max-w-md mx-auto">
              Start free, then choose the experience that works best for you.
            </p>
          </div>

          {/* Channel chooser — two premium cards that double as the channel
              toggle. Selecting one updates `channel`, which drives the price
              shown on every plan card below. WhatsApp is positioned as the
              recommended, full-featured experience with its 7-day trial;
              Telegram as a genuinely free, permanent alternative — neither
              is framed as a discount or a downgrade. */}
          <div className="max-w-3xl mx-auto mb-3 flex items-center justify-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">1</span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Pick where you'll track</span>
          </div>
          <div className="max-w-3xl mx-auto mb-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* WhatsApp option */}
            <button
              type="button"
              onClick={() => setChannel("whatsapp")}
              aria-pressed={channel === "whatsapp"}
              className={`group relative text-left rounded-[26px] border backdrop-blur-xl p-6 transition-all duration-300 ${
                channel === "whatsapp"
                  ? "border-emerald-200 bg-white shadow-[0_0_40px_rgba(52,211,153,0.15)]"
                  : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> Recommended
                </span>
                {channel === "whatsapp" && (
                  <span className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-slate-950" strokeWidth={3} />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <WhatsAppIcon className="w-5 h-5 text-emerald-600" />
                <span className="text-lg font-bold text-slate-900">WhatsApp</span>
              </div>

              <div className="text-2xl font-black text-emerald-600 tracking-tight mb-1">7 DAYS FREE</div>
              <p className="text-slate-600 text-xs leading-relaxed">Try BroFInAi free on WhatsApp for 7 days.</p>
              <p className="text-slate-500 text-xs leading-relaxed mt-1">Then choose a paid plan to continue.</p>

              <Link
                href="/register?plan=free&channel=whatsapp&type=direct"
                prefetch={false}
                onClick={(e) => e.stopPropagation()}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-600 transition-colors"
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
                  ? "border-sky-200 bg-white shadow-[0_0_40px_rgba(56,189,248,0.15)]"
                  : "border-slate-200 bg-white hover:border-sky-200 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-600 text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> Free Forever
                </span>
                {channel === "telegram" && (
                  <span className="w-5 h-5 rounded-full bg-sky-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-slate-950" strokeWidth={3} />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <TelegramIcon className="w-5 h-5 text-sky-600" />
                <span className="text-lg font-bold text-slate-900">Telegram</span>
              </div>

              <div className="text-2xl font-black text-sky-600 tracking-tight mb-1">$0</div>
              <p className="text-slate-600 text-xs leading-relaxed">Track your money on Telegram with no subscription required.</p>

              <Link
                href="/register?plan=free&channel=telegram&type=direct"
                prefetch={false}
                onClick={(e) => e.stopPropagation()}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-600 transition-colors"
              >
                Start Free on Telegram
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </button>
          </div>

          <p className="max-w-lg mx-auto text-center text-[11px] text-slate-600 leading-relaxed mb-10">
            WhatsApp messaging has higher operating costs, while Telegram bot messaging is significantly cheaper to operate. That's why pricing differs by channel.
          </p>

          {/* Step 2 label + a compact channel switcher repeated here, so it's
              unmistakable that the plan prices below belong to whichever
              channel is selected — without changing any of the underlying
              channel/price logic. */}
          <div className="flex flex-col items-center gap-3 mb-10">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">2</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Then choose your plan</span>
            </div>
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setChannel("whatsapp")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  channel === "whatsapp" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp prices
              </button>
              <button
                type="button"
                onClick={() => setChannel("telegram")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  channel === "telegram" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <TelegramIcon className="w-3.5 h-3.5" /> Telegram prices
              </button>
            </div>
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

                {/* Card background — plain rounded box (previously a speech-bubble
                    mask shape; swapped for a simpler flat card). */}
                <div
                  className={`absolute inset-0 rounded-3xl border transition-colors duration-300 backdrop-blur-xl ${
                    plan.highlight
                      ? "border-emerald-200 bg-white group-hover:bg-white shadow-[0_0_40px_rgba(52,211,153,0.15)]"
                      : "border-slate-200 bg-white group-hover:bg-white"
                  }`}
                />

                <div className="relative z-10 flex flex-col justify-between h-full px-7 py-7 md:px-9 md:py-9">
                  <div>
                  {/* Header */}
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                      {plan.name}
                    </span>
                    <div className="relative h-11 md:h-14 mt-2 flex items-center gap-2">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={`${plan.id}-${channel}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="flex items-baseline gap-1"
                        >
                          <span className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 whitespace-nowrap">
                            {plan.prices[channel]}
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            {plan.period}
                          </span>
                        </motion.div>
                      </AnimatePresence>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={`${plan.id}-tag-${channel}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                            channel === "whatsapp" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-sky-50 text-sky-600 border border-sky-200"
                          }`}
                        >
                          <ChannelIcon className="w-2.5 h-2.5" /> {meta.label}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    {plan.id === "free" ? (
                      <p className="text-[11px] font-medium mt-0.5 text-emerald-600">
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
                      <p className="text-[11px] text-purple-600 font-medium mt-1">
                        {plan.badge}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {plan.description}
                    </p>
                    {plan.trialNote && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        {plan.trialNote[channel]}
                      </p>
                    )}
                  </div>

                  <div className="w-full h-[1px] bg-slate-900/10 my-6" />

                  {/* Features List */}
                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-xs">
                        {feat.included ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <span className={feat.included ? "text-slate-700" : "text-slate-500 line-through"}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  </div>

                  {/* Action Button — plan + channel both carry through to register */}
                  <Link
                    href={`/register?plan=${plan.id}&channel=${channel}&type=direct`}
                    prefetch={false}
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
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors"
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
                  <div className="rounded-2xl border border-slate-200 overflow-x-auto">
                    <table className="w-full text-xs min-w-[520px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-900/[0.03]">
                          <th className="text-left font-semibold text-slate-600 uppercase tracking-wider px-5 py-3">Feature</th>
                          <th className="text-center font-semibold text-slate-600 uppercase tracking-wider px-5 py-3">Lite</th>
                          <th className="text-center font-semibold text-emerald-600 uppercase tracking-wider px-5 py-3">Core</th>
                          <th className="text-center font-semibold text-purple-600 uppercase tracking-wider px-5 py-3">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {FEATURE_COMPARISON.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-200 last:border-b-0 odd:bg-slate-900/[0.015]">
                            <td className="px-5 py-3 text-slate-600">{row.label}</td>
                            {[row.free, row.core, row.max].map((val, i) => (
                              <td key={i} className="px-5 py-3 text-center">
                                {typeof val === "boolean" ? (
                                  val ? (
                                    <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                                  ) : (
                                    <X className="w-4 h-4 text-slate-600 mx-auto" />
                                  )
                                ) : (
                                  <span className="text-slate-700">{val}</span>
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
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted payment processing via LemonSqueezy. Cancel anytime.</span>
          </div>
        </motion.div>
      </section>

      {/* TRUST & PRIVACY — a finance product asking people to hand over
          spending data needs to earn that trust explicitly, not imply it.
          Calls out security, data control, and exactly where AI stops and
          the user's own decision takes over. */}
      <section id="trust" className="scroll-mt-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-1/4 w-[460px] h-[460px] rounded-full bg-emerald-50 blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-cyan-50 blur-[140px]" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative max-w-7xl mx-auto px-6 py-28 border-t border-slate-200"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-14 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/5 border border-slate-200 text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">
              <Lock className="w-3.5 h-3.5" /> Built On Trust
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Your Money Data
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Deserves Privacy.
              </span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
              You're trusting us with real financial details. We take that seriously — with encryption, clear consent, and full control staying in your hands.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Lock,
                emoji: "🔒",
                title: "Secure by Design",
                desc: "Every message is encrypted in transit and at rest — your spending data is never sent or stored in the clear.",
                accent: "emerald",
              },
              {
                icon: ShieldCheck,
                emoji: "🛡️",
                title: "Privacy Focused",
                desc: "We collect only what's needed to track your spending. Your data is never sold, and never shared with advertisers.",
                accent: "cyan",
              },
              {
                icon: User,
                emoji: "👤",
                title: "You Control Your Data",
                desc: "Export, correct, or delete your data any time — right from chat. Nothing is locked away from you.",
                accent: "sky",
              },
              {
                icon: Sparkles,
                emoji: "🤖",
                title: "AI Assists — You Decide",
                desc: "The AI categorizes and suggests, but every entry is editable and every decision is yours to confirm or change.",
                accent: "purple",
              },
            ].map((item) => {
              const ACCENTS: Record<string, { ring: string; bar: string; badge: string; glow: string; text: string }> = {
                emerald: { ring: "from-emerald-200 via-slate-200 to-white", bar: "from-emerald-400 to-emerald-200", badge: "from-emerald-400 to-emerald-300", glow: "shadow-emerald-500/25", text: "text-white" },
                cyan: { ring: "from-cyan-200 via-slate-200 to-white", bar: "from-cyan-400 to-cyan-200", badge: "from-cyan-400 to-cyan-300", glow: "shadow-cyan-500/25", text: "text-white" },
                sky: { ring: "from-sky-200 via-slate-200 to-white", bar: "from-sky-400 to-sky-200", badge: "from-sky-400 to-sky-300", glow: "shadow-sky-500/25", text: "text-white" },
                purple: { ring: "from-purple-200 via-slate-200 to-white", bar: "from-purple-400 to-purple-200", badge: "from-purple-400 to-purple-300", glow: "shadow-purple-500/25", text: "text-white" },
              };
              const a = ACCENTS[item.accent];
              return (
                <motion.div
                  key={item.title}
                  variants={fadeInUp}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`group relative rounded-[26px] p-[1.5px] bg-gradient-to-br ${a.ring} shadow-lg hover:shadow-xl transition-shadow duration-300`}
                >
                  <div className="relative h-full p-6 rounded-[25px] bg-white overflow-hidden">
                    <span className={`absolute top-0 left-6 right-6 h-[3px] rounded-full bg-gradient-to-r ${a.bar}`} />
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-slate-900/[0.02] to-transparent" />
                    <div className="relative space-y-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.badge} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg ${a.glow}`}>
                        <item.icon className={`w-5 h-5 ${a.text}`} />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>{item.emoji}</span> {item.title}
                      </h3>
                      <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div variants={fadeInUp} className="mt-10 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Bank-grade encryption on every message. You're always in control of your data.</span>
          </motion.div>
        </motion.div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="scroll-mt-24 max-w-4xl mx-auto px-6 py-28 border-t border-slate-200">
        <div className="text-center mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-bold uppercase tracking-widest text-cyan-600">
            <MessageCircle className="w-3.5 h-3.5" /> FAQ
          </div>
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
            <div key={index} className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full p-6 text-left flex justify-between items-center font-bold text-sm sm:text-base hover:text-purple-600 transition"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${activeFaq === index ? "rotate-180 text-purple-600" : "text-slate-500"}`} />
              </button>

              <AnimatePresence>
                {activeFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-4"
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
        <div className="relative p-12 rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-center space-y-8 overflow-hidden shadow-2xl shadow-emerald-900/20">
          {/* Decorative dot-grid + soft glows — gives the closing banner a
              premium, global-brand finish instead of a flat color block. */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
            <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cta-dots" width="22" height="22" patternUnits="userSpaceOnUse">
                  <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cta-dots)" />
            </svg>
          </div>

          <div className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/30 text-white text-[11px] font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" /> Trusted by 10,000+ users worldwide
          </div>

          <h2 className="relative text-4xl md:text-5xl font-black tracking-tight max-w-2xl mx-auto text-white">
            Ready to Master Your Finances Globally?
          </h2>
          <p className="text-emerald-50 text-sm md:text-base max-w-xl mx-auto">
            Be one of the first to experience smarter money management.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register?plan=free&channel=whatsapp&type=direct"
              prefetch={false}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm bg-white text-emerald-700 hover:bg-emerald-50 transition shadow-2xl shadow-emerald-900/20"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Start on WhatsApp</span>
            </Link>
            <Link
              href="/register?plan=free&channel=telegram&type=direct"
              prefetch={false}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm bg-white/15 border border-white/30 text-white hover:bg-white/25 transition"
            >
              <TelegramIcon className="w-4 h-4 text-white" />
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
          className="max-w-7xl mx-auto px-6 py-28 border-t border-slate-200"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-xs font-bold uppercase tracking-widest text-pink-600">
              <Mail className="w-3.5 h-3.5" /> Get In Touch
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">We'd Love to Hear From You</h2>
            <p className="text-slate-600 text-sm md:text-base max-w-md mx-auto">
              Questions, feedback, or partnership ideas — our team usually replies within 24 hours.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-start">
            {/* Contact Info Cards */}
            <motion.div variants={fadeInUp} className="lg:col-span-4 space-y-4">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-200 transition-all flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Email Us</h3>
                  <a href="mailto:support@brofinai.com" className="text-slate-600 text-xs hover:text-emerald-600 transition-colors">support@brofinai.com</a>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-200 transition-all flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <WhatsAppIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">WhatsApp Support</h3>
                  <span className="text-slate-600 text-xs">+94 729 367 157</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-sky-200 transition-all flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <TelegramIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Telegram Support</h3>
                  <span className="text-slate-600 text-xs">@BroFInAi_Support</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-purple-200 transition-all flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Call Us</h3>
                  <span className="text-slate-600 text-xs">+94 729 367 157</span>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div variants={fadeInUp} className="lg:col-span-8">
              <form
                onSubmit={handleContactSubmit}
                className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 backdrop-blur-xl space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/5 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-emerald-200 focus:bg-slate-900/[0.07] transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/5 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-emerald-200 focus:bg-slate-900/[0.07] transition"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us what's on your mind..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/5 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-emerald-200 focus:bg-slate-900/[0.07] transition resize-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <AnimatePresence>
                    {contactSent && (
                      <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Message sent — we'll be in touch!
                      </motion.span>
                    )}
                    {contactError && (
                      <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-red-600 font-semibold"
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
      <footer className="border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            {/* Brand Column */}
            <div className="md:col-span-5 space-y-5">
              <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight w-fit">
                <img src="/logo-icon.png" alt="BroFInAi logo" className="w-9 h-9 object-contain" />
                <span className="text-2xl font-black bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent">
                  Bro<span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">FInAi</span>
                </span>
              </Link>
              <p className="text-slate-600 text-sm leading-relaxed max-w-sm">
                Track every expense right inside WhatsApp or Telegram. No new apps, no spreadsheets — just message, snap, and go.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <a href="https://wa.me/94729367157" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-9 h-9 rounded-full bg-slate-900/5 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition">
                  <WhatsAppIcon className="w-4 h-4" />
                </a>
                <a href="https://t.me/BroFinAi_support" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="w-9 h-9 rounded-full bg-slate-900/5 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-sky-600 hover:border-sky-200 transition">
                  <TelegramIcon className="w-4 h-4" />
                </a>
                <a href="https://x.com/brofinai" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="w-9 h-9 rounded-full bg-slate-900/5 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-200 transition">
                  <TwitterIcon className="w-4 h-4" />
                </a>
                <a href="https://www.instagram.com/hello.brofinai/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full bg-slate-900/5 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-200 transition">
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a href="https://web.facebook.com/profile.php?id=61593361653835" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full bg-slate-900/5 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-200 transition">
                  <FacebookIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600">Product</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><a href="#features" onClick={(e) => scrollToSection(e, "features")} className="hover:text-slate-900 transition-colors">Features</a></li>
                <li><a href="#language" onClick={(e) => scrollToSection(e, "language")} className="hover:text-slate-900 transition-colors">Language</a></li>
                <li><a href="#how-it-works" onClick={(e) => scrollToSection(e, "how-it-works")} className="hover:text-slate-900 transition-colors">How It Works</a></li>
                <li><a href="#pricing" onClick={(e) => scrollToSection(e, "pricing")} className="hover:text-slate-900 transition-colors">Pricing</a></li>
                <li><a href="#faq" onClick={(e) => scrollToSection(e, "faq")} className="hover:text-slate-900 transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><a href="#trust" onClick={(e) => scrollToSection(e, "trust")} className="hover:text-slate-900 transition-colors">Trust & Security</a></li>
                <li><Link href="/privacy-policy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-slate-900 transition-colors">Terms of Service</Link></li>
                <li><Link href="/refund-policy" className="hover:text-slate-900 transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">© {new Date().getFullYear()} BroFInAi. All rights reserved.</span>
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Bank-grade encryption on every message
            </span>
          </div>
        </div>
      </footer>

      {/* FLOATING STICKY DOCK — reflects whichever channel is active */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-3xl">
        <div className="p-3 sm:p-4 rounded-full bg-slate-50 backdrop-blur-2xl border border-slate-200 shadow-2xl flex items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full animate-ping shrink-0 transition-colors duration-500 ${meta.dot}`} />
            <AnimatePresence mode="wait">
              <motion.span
                key={`dock-${channel}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-xs sm:text-sm font-semibold text-slate-700 truncate"
              >
                Free {meta.label} Expense Tracker
              </motion.span>
            </AnimatePresence>
          </div>

          <Link
            href={`/register?plan=free&channel=${channel}&type=direct`}
            prefetch={false}
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