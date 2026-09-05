"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  X,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Loader2,
} from "lucide-react";

type Channel = "whatsapp" | "telegram";
type PlanId = "free" | "core" | "max";

// Brand marks for the two supported chat channels — same filled-SVG style
// used across the rest of the site (landing page, dashboard).
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

// Per-channel accent colors for the highlighted (Core) plan card, the small
// channel-label pill next to each price, and text accents — mirrors the
// landing page's channel-aware pricing treatment exactly.
const CHANNEL_META: Record<
  Channel,
  { label: string; icon: React.FC<{ className?: string }>; text: string; highlightBg: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    icon: WhatsAppIcon,
    text: "text-emerald-600",
    highlightBg: "from-emerald-600 via-teal-600 to-cyan-700",
  },
  telegram: {
    label: "Telegram",
    icon: TelegramIcon,
    text: "text-sky-600",
    highlightBg: "from-sky-600 via-blue-600 to-indigo-700",
  },
};

const PLAN_RANK: Record<PlanId, number> = { free: 0, core: 1, max: 2 };

// Same plan data as the landing page's pricing section, so this standalone
// page (direct /pricing visits + the dashboard's upgrade flow) always
// matches it exactly.
const PRICING_PLANS: {
  id: PlanId;
  name: string;
  prices: { whatsapp: string; telegram: string };
  period: string;
  badge: string;
  description: string;
  highlight: boolean;
  buttonText: string;
  buttonClass: string;
  trialNote: { whatsapp: string; telegram: string } | null;
  features: { text: string; included: boolean }[];
}[] = [
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
    buttonClass: "bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-900/25",
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

// Full row-by-row feature comparison (collapsible table under the cards) —
// same data as the landing page.
const FEATURE_COMPARISON: { label: string; free: string | boolean; core: string | boolean; max: string | boolean }[] = [
  { label: "Text transaction logging", free: "3/day", core: "10/day", max: "Unlimited" },
  { label: "Receipt scan (AI vision)", free: "1/day", core: "30/month", max: "Unlimited" },
  { label: "Voice note logging", free: false, core: "5/day", max: "Unlimited" },
  { label: "Budget setting", free: false, core: true, max: true },
  { label: "Excel export", free: false, core: true, max: true },
  { label: "Multi-language (Sinhala/Singlish/auto-translate)", free: true, core: true, max: true },
  { label: "Web dashboard access", free: true, core: true, max: true },
];

function PricingContent() {
  const searchParams = useSearchParams();

  const isUpgrade = searchParams.get("mode") === "upgrade";
  const userId = searchParams.get("user_id") || "";
  // Some older links still pass "lite" instead of "free" for the entry plan —
  // normalize so the rank comparisons below work either way.
  const currentPlanRaw = (searchParams.get("current_plan") || "free").toLowerCase();
  const currentPlan: PlanId = currentPlanRaw === "lite" ? "free" : (currentPlanRaw as PlanId);
  const paramChannel = searchParams.get("current_channel") as Channel | null;
  const highlightPlanParam = searchParams.get("plan") as PlanId | null;

  const [channel, setChannel] = useState<Channel>(
    paramChannel === "telegram" || paramChannel === "whatsapp" ? paramChannel : "whatsapp"
  );
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [checkoutError, setCheckoutError] = useState<string>("");
  const [showComparison, setShowComparison] = useState(false);

  // If the dashboard tells us which channel is already linked, that's the
  // only sensible default in upgrade mode — no point showing them a channel
  // they haven't connected yet as the pre-selected one.
  useEffect(() => {
    if (isUpgrade && (paramChannel === "telegram" || paramChannel === "whatsapp")) {
      setChannel(paramChannel);
    }
  }, [isUpgrade, paramChannel]);

  const handleUpgradeCheckout = async (planId: PlanId) => {
    if (!userId) {
      setCheckoutError("Missing user session — please go back to your dashboard and try again.");
      return;
    }
    setCheckoutError("");
    setCheckoutLoading(planId);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          channel,
          user_id: userId,
          mode: "upgrade",
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError("Couldn't start checkout — please try again in a moment.");
        setCheckoutLoading(null);
      }
    } catch {
      setCheckoutError("Couldn't start checkout — please try again in a moment.");
      setCheckoutLoading(null);
    }
  };

  const meta = CHANNEL_META[channel];

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Site Logo */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 font-bold text-xl tracking-tight mb-10 hover:opacity-90 transition"
        >
          <img src="/logo-icon.png" alt="BroFInAi logo" className="w-9 h-9 object-contain" />
          <span className="text-2xl font-black text-slate-900">
            Bro<span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">FInAi</span>
          </span>
        </Link>

        {/* Header */}
        <div className="text-center space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-600 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            {isUpgrade ? "Upgrade Your Plan" : "Plans That Fit How You Use BroFInAi"}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">
            {isUpgrade ? "Unlock More With Core or Max" : "Choose How You Want to Track"}
          </h1>
          <p className="text-slate-600 text-sm md:text-base max-w-md mx-auto">
            {isUpgrade
              ? "Your plan updates instantly — same chat, same history, just unlocked."
              : "Start free, then choose the experience that works best for you."}
          </p>
        </div>

        {isUpgrade && paramChannel && (
          <p className="max-w-md mx-auto text-center text-[11px] text-slate-500 -mt-8 mb-10">
            You're currently connected on{" "}
            <span className="font-semibold text-slate-700">{paramChannel === "telegram" ? "Telegram" : "WhatsApp"}</span>{" "}
            — switching here will link a new channel too.
          </p>
        )}

        {!isUpgrade && (
          <>
            {/* Channel chooser — two premium cards that double as the channel
                toggle, same as the landing page's pricing section. WhatsApp is
                positioned as the recommended, full-featured experience with its
                7-day trial; Telegram as a genuinely free, permanent alternative. */}
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
                className={`group relative text-left rounded-[26px] border-2 backdrop-blur-xl p-6 transition-all duration-300 appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                  channel === "whatsapp"
                    ? "border-transparent bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-[0_20px_50px_rgba(13,148,136,0.35)]"
                    : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center shadow-lg ${channel === "whatsapp" ? "bg-white/15 shadow-black/10" : "bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-emerald-500/25"}`}>
                      <WhatsAppIcon className="w-5.5 h-5.5 text-white" />
                    </div>
                    <span className={`text-lg font-bold ${channel === "whatsapp" ? "text-white" : "text-slate-900"}`}>WhatsApp</span>
                  </div>
                  {channel === "whatsapp" ? (
                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[9px] font-bold uppercase tracking-widest shrink-0">
                      <Sparkles className="w-2.5 h-2.5" /> Recommended
                    </span>
                  )}
                </div>

                <div className={`text-2xl font-black tracking-tight mb-1 ${channel === "whatsapp" ? "text-white" : "text-emerald-600"}`}>7 DAYS FREE</div>
                <p className={`text-xs leading-relaxed ${channel === "whatsapp" ? "text-white/80" : "text-slate-600"}`}>Try BroFInAi free on WhatsApp for 7 days.</p>
                <p className={`text-xs leading-relaxed mt-1 ${channel === "whatsapp" ? "text-white/60" : "text-slate-500"}`}>Then choose a paid plan to continue.</p>

                <Link
                  href="/register?plan=free&channel=whatsapp&type=direct"
                  prefetch={false}
                  onClick={(e) => e.stopPropagation()}
                  className={`mt-5 w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-full py-3 shadow-lg transition-all ${
                    channel === "whatsapp"
                      ? "text-emerald-700 bg-white hover:bg-emerald-50 shadow-black/10"
                      : "text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/25"
                  }`}
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
                className={`group relative text-left rounded-[26px] border-2 backdrop-blur-xl p-6 transition-all duration-300 appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                  channel === "telegram"
                    ? "border-transparent bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 shadow-[0_20px_50px_rgba(37,99,235,0.35)]"
                    : "border-slate-200 bg-white hover:border-sky-200 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center shadow-lg ${channel === "telegram" ? "bg-white/15 shadow-black/10" : "bg-gradient-to-br from-sky-400 to-blue-500 shadow-sky-500/25"}`}>
                      <TelegramIcon className="w-5.5 h-5.5 text-white" />
                    </div>
                    <span className={`text-lg font-bold ${channel === "telegram" ? "text-white" : "text-slate-900"}`}>Telegram</span>
                  </div>
                  {channel === "telegram" ? (
                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-sky-600" strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-600 text-[9px] font-bold uppercase tracking-widest shrink-0">
                      <Sparkles className="w-2.5 h-2.5" /> Free Forever
                    </span>
                  )}
                </div>

                <div className={`text-2xl font-black tracking-tight mb-1 ${channel === "telegram" ? "text-white" : "text-sky-600"}`}>$0</div>
                <p className={`text-xs leading-relaxed ${channel === "telegram" ? "text-white/80" : "text-slate-600"}`}>Track your money on Telegram with no subscription required.</p>

                <Link
                  href="/register?plan=free&channel=telegram&type=direct"
                  prefetch={false}
                  onClick={(e) => e.stopPropagation()}
                  className={`mt-5 w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-full py-3 shadow-lg transition-all ${
                    channel === "telegram"
                      ? "text-blue-700 bg-white hover:bg-sky-50 shadow-black/10"
                      : "text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-sky-500/25"
                  }`}
                >
                  Start Free on Telegram
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </button>
            </div>

            <p className="max-w-lg mx-auto text-center text-[11px] text-slate-600 leading-relaxed mb-10">
              WhatsApp messaging has higher operating costs, while Telegram bot messaging is significantly cheaper to operate. That's why pricing differs by channel.
            </p>
          </>
        )}

        {/* Step label + compact channel switcher — drives the price shown on
            every plan card below. */}
        <div className="flex flex-col items-center gap-3 mb-10">
          {!isUpgrade && (
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">2</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Then choose your plan</span>
            </div>
          )}
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

        {checkoutError && (
          <div className="max-w-md mx-auto mb-8 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
            {checkoutError}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">
          {PRICING_PLANS.map((plan) => {
            const isCurrentPlan = isUpgrade && plan.id === currentPlan;
            const isDowngrade = isUpgrade && PLAN_RANK[plan.id] < PLAN_RANK[currentPlan];
            const isRecommended = !isUpgrade
              ? plan.highlight
              : plan.id === highlightPlanParam || (plan.highlight && !highlightPlanParam);
            const ChannelIcon = meta.icon;

            return (
              <div
                key={plan.id}
                className={`group relative flex flex-col transition-all duration-300 ${
                  isRecommended
                    ? channel === "whatsapp"
                      ? "scale-[1.02] drop-shadow-[0_20px_50px_rgba(13,148,136,0.35)]"
                      : "scale-[1.02] drop-shadow-[0_20px_50px_rgba(37,99,235,0.35)]"
                    : ""
                } ${isDowngrade ? "opacity-50" : ""}`}
              >
                {/* Highlight Badge */}
                {isRecommended && !isCurrentPlan && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 bg-slate-900 text-white font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-md shadow-slate-900/30">
                    <Sparkles className="w-3 h-3" />
                    {plan.badge}
                  </div>
                )}

                {/* Card background — highlighted plan gets a full gradient
                    fill (dark, on-brand); the other two stay flat white cards. */}
                <div
                  className={`absolute inset-0 rounded-3xl border transition-colors duration-300 backdrop-blur-xl ${
                    isRecommended
                      ? `border-transparent bg-gradient-to-br ${meta.highlightBg}`
                      : "border-slate-200 bg-white group-hover:bg-white"
                  }`}
                />

                <div className="relative z-10 flex flex-col justify-between h-full px-7 py-7 md:px-9 md:py-9">
                  <div>
                    {/* Header */}
                    <div className="mb-6">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isRecommended ? "text-white/80" : meta.text}`}>
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
                            <span className={`text-4xl md:text-5xl font-black tracking-tight whitespace-nowrap ${isRecommended ? "text-white" : "text-slate-900"}`}>
                              {plan.prices[channel]}
                            </span>
                            <span className={`text-xs font-medium ${isRecommended ? "text-white/70" : "text-slate-600"}`}>
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
                              isRecommended
                                ? "bg-white/15 text-white border border-white/25"
                                : channel === "whatsapp"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                  : "bg-sky-50 text-sky-600 border border-sky-200"
                            }`}
                          >
                            <ChannelIcon className="w-2.5 h-2.5" /> {meta.label}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                      {plan.id === "free" ? (
                        <p className={`text-[11px] font-medium mt-0.5 ${isRecommended ? "text-white/90" : meta.text}`}>
                          {channel === "whatsapp" ? "7-Day Trial" : "Free Forever"}
                        </p>
                      ) : (
                        plan.prices.telegram !== plan.prices.whatsapp && (
                          <p className={`text-[11px] font-medium mt-0.5 ${isRecommended ? "text-white/70" : "text-slate-500"}`}>
                            Price varies by channel
                          </p>
                        )
                      )}
                      {!isRecommended && plan.id !== "free" && (
                        <p className={`text-[11px] font-medium mt-1 ${meta.text}`}>{plan.badge}</p>
                      )}
                      <p className={`text-xs mt-2 leading-relaxed ${isRecommended ? "text-white/80" : "text-slate-600"}`}>
                        {plan.description}
                      </p>
                      {plan.trialNote && !isUpgrade && (
                        <p className={`text-[11px] font-medium mt-1 ${isRecommended ? "text-white/90" : meta.text}`}>
                          {plan.trialNote[channel]}
                        </p>
                      )}
                      {isCurrentPlan && (
                        <p className={`text-[11px] font-semibold mt-2 ${isRecommended ? "text-white/90" : "text-slate-500"}`}>
                          Your current plan
                        </p>
                      )}
                    </div>

                    <div className={`w-full h-[1px] my-6 ${isRecommended ? "bg-white/15" : "bg-slate-900/10"}`} />

                    {/* Features List */}
                    <ul className="space-y-3.5 mb-8">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-xs">
                          {feat.included ? (
                            <Check className={`w-4 h-4 shrink-0 ${isRecommended ? (channel === "whatsapp" ? "text-emerald-200" : "text-sky-200") : meta.text}`} />
                          ) : (
                            <X className={`w-4 h-4 shrink-0 ${isRecommended ? "text-white/40" : "text-slate-600"}`} />
                          )}
                          <span
                            className={
                              feat.included
                                ? isRecommended ? "text-white/90" : "text-slate-700"
                                : isRecommended ? "text-white/40 line-through" : "text-slate-500 line-through"
                            }
                          >
                            {feat.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button — behavior differs by mode */}
                  {isUpgrade ? (
                    isCurrentPlan ? (
                      <div className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-full text-xs tracking-wider uppercase font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        Current Plan
                      </div>
                    ) : isDowngrade ? (
                      <div className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-full text-xs tracking-wider uppercase font-bold bg-slate-100 text-slate-400 border border-slate-200">
                        Included
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpgradeCheckout(plan.id)}
                        disabled={checkoutLoading !== null}
                        className={`w-full py-3.5 px-4 rounded-full text-center text-xs tracking-wider uppercase font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${plan.buttonClass}`}
                      >
                        {checkoutLoading === plan.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>Upgrade Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )
                  ) : (
                    <Link
                      href={`/register?plan=${plan.id}&channel=${channel}&type=direct`}
                      prefetch={false}
                      className={`w-full py-3.5 px-4 rounded-full text-center text-xs tracking-wider uppercase font-bold transition flex items-center justify-center gap-2 cursor-pointer ${plan.buttonClass}`}
                    >
                      <span>{plan.buttonText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
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
                        <th className={`text-center font-semibold uppercase tracking-wider px-5 py-3 ${meta.text}`}>Core</th>
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
                                  <Check className={`w-4 h-4 mx-auto ${meta.text}`} />
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
      </div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}