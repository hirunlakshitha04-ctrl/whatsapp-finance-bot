"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bot,
  Phone,
  Sparkles,
  Check,
  X,
  Zap,
  Mic,
  ScanLine,
  Target,
  FileSpreadsheet,
  HandCoins,
  Languages,
  LayoutDashboard,
  ArrowRight,
  Tag,
  Loader2,
} from "lucide-react";

type Channel = "whatsapp" | "telegram";
type PlanKey = "lite" | "core" | "max";

interface PlanDef {
  key: PlanKey;
  name: string;
  tagline: string;
  waPrice: number;
  tgPrice: number;
  highlight?: boolean;
}

const PLANS: PlanDef[] = [
  { key: "lite", name: "Lite", tagline: "Just getting started", waPrice: 0, tgPrice: 0 },
  { key: "core", name: "Core", tagline: "For daily tracking", waPrice: 3.5, tgPrice: 2.5, highlight: true },
  { key: "max", name: "Max", tagline: "Unlimited everything", waPrice: 6.99, tgPrice: 4.0 },
];

interface FeatureRow {
  label: string;
  icon: React.ElementType;
  lite: string;
  core: string;
  max: string;
}

const FEATURES: FeatureRow[] = [
  { label: "Text transaction logging", icon: Zap, lite: "3/day", core: "10/day", max: "Unlimited" },
  { label: "Receipt scan (AI vision)", icon: ScanLine, lite: "1/day", core: "30/month", max: "Unlimited" },
  { label: "Voice note logging", icon: Mic, lite: "—", core: "5/day", max: "Unlimited" },
  { label: "Budget setting", icon: Target, lite: "—", core: "✓", max: "✓" },
  { label: "Excel export", icon: FileSpreadsheet, lite: "—", core: "✓", max: "✓" },
  { label: "Loan tracking", icon: HandCoins, lite: "✓", core: "✓", max: "✓" },
  { label: "Multi-language (Sinhala/Singlish/auto)", icon: Languages, lite: "✓", core: "✓", max: "✓" },
  { label: "Web dashboard access", icon: LayoutDashboard, lite: "✓", core: "✓", max: "✓" },
];

const PLAN_RANK: Record<PlanKey, number> = { lite: 0, core: 1, max: 2 };

function pct(from: number, to: number) {
  if (from <= 0) return 0;
  return Math.round(((from - to) / from) * 100);
}

function FeatureCell({ value }: { value: string }) {
  if (value === "✓") return <Check className="w-4 h-4 text-emerald-400 mx-auto" />;
  if (value === "—") return <X className="w-4 h-4 text-slate-600 mx-auto" />;
  return <span className="text-xs text-slate-300">{value}</span>;
}

function PricingContent() {
  const searchParams = useSearchParams();

  const isUpgrade = searchParams.get("mode") === "upgrade";
  const userId = searchParams.get("user_id") || "";
  const currentPlan = (searchParams.get("current_plan") || "lite").toLowerCase() as PlanKey;
  const paramChannel = searchParams.get("current_channel") as Channel | null;
  const highlightPlanParam = searchParams.get("plan") as PlanKey | null;

  const [channel, setChannel] = useState<Channel>(
    paramChannel === "telegram" || paramChannel === "whatsapp" ? paramChannel : "whatsapp"
  );
  const [checkoutLoading, setCheckoutLoading] = useState<PlanKey | null>(null);
  const [checkoutError, setCheckoutError] = useState<string>("");

  // If the dashboard tells us which channel is already linked, that's the
  // only sensible default in upgrade mode — no point showing them a channel
  // they haven't connected yet as the pre-selected one.
  useEffect(() => {
    if (isUpgrade && (paramChannel === "telegram" || paramChannel === "whatsapp")) {
      setChannel(paramChannel);
    }
  }, [isUpgrade, paramChannel]);

  const handleUpgradeCheckout = async (planKey: PlanKey) => {
    if (!userId) {
      setCheckoutError("Missing user session — please go back to your dashboard and try again.");
      return;
    }
    setCheckoutError("");
    setCheckoutLoading(planKey);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planKey,
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
    } catch (err) {
      setCheckoutError("Couldn't start checkout — please try again in a moment.");
      setCheckoutLoading(null);
    }
  };

  return (
    <main className="min-h-screen relative bg-[#07090e] overflow-hidden font-sans text-white py-16 px-4">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-pink-600/25 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-600/20 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Site Logo */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 font-bold text-xl tracking-tight mb-8 hover:opacity-90 transition"
        >
          <img src="/logo-icon.png" alt="BroFInAi logo" className="w-9 h-9 object-contain" />
          <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Bro<span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">FInAi</span>
          </span>
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {isUpgrade ? "Upgrade your plan" : "Simple, transparent pricing"}
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
            {isUpgrade ? (
              <>
                Unlock more with <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Core or Max.
                </span>
              </>
            ) : (
              <>
                Track money where <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  you already chat.
                </span>
              </>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-4 max-w-md mx-auto">
            {isUpgrade
              ? "Your plan updates instantly — same chat, same history, just unlocked."
              : "Same BroFinAi, same features — pick the app you live in."}
          </p>
        </div>

        {/* Channel Toggle */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative inline-flex p-1 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
            <button
              onClick={() => setChannel("whatsapp")}
              className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                channel === "whatsapp" ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Phone className="w-4 h-4" /> WhatsApp
            </button>
            <button
              onClick={() => setChannel("telegram")}
              className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                channel === "telegram" ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Bot className="w-4 h-4" /> Telegram
            </button>
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r transition-all duration-300 ease-out ${
                channel === "whatsapp" ? "left-1 from-emerald-500 to-teal-500" : "left-[calc(50%+3px)] from-sky-500 to-blue-500"
              }`}
            />
          </div>

          {isUpgrade && paramChannel && (
            <p className="text-[11px] text-slate-500 mt-2.5">
              You're currently connected on <span className="text-slate-300 font-medium">{paramChannel === "telegram" ? "Telegram" : "WhatsApp"}</span> — switching here will link a new channel too.
            </p>
          )}

          <div
            className={`mt-3 overflow-hidden transition-all duration-300 ease-out ${
              channel === "telegram" ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-sky-300 bg-sky-500/10 border border-sky-500/25 rounded-full px-3.5 py-1.5">
              <Tag className="w-3.5 h-3.5" /> Telegram has zero messaging fees — up to 43% cheaper, passed on to you
            </div>
          </div>
        </div>

        {checkoutError && (
          <div className="max-w-md mx-auto mb-8 text-xs text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-center">
            {checkoutError}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {PLANS.map((plan) => {
            const price = channel === "whatsapp" ? plan.waPrice : plan.tgPrice;
            const discount = pct(plan.waPrice, plan.tgPrice);
            const showDiscountBadge = channel === "telegram" && discount > 0;
            const showTelegramNudge = channel === "whatsapp" && discount > 0;

            const isCurrentPlan = isUpgrade && plan.key === currentPlan;
            const isDowngrade = isUpgrade && PLAN_RANK[plan.key] < PLAN_RANK[currentPlan];
            const isRecommended = !isUpgrade ? plan.highlight : plan.key === highlightPlanParam || (plan.highlight && !highlightPlanParam);

            return (
              <div
                key={plan.key}
                className={`relative flex flex-col transition-all duration-300 ${
                  isRecommended ? "scale-[1.02]" : ""
                } ${isDowngrade ? "opacity-50" : ""}`}
              >
                {/* Border layer */}
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-[28px]"
                  style={{
                    background: isRecommended
                      ? "linear-gradient(135deg, #a855f7, #ec4899)"
                      : "rgba(255,255,255,0.14)",
                  }}
                />
                {/* Fill layer */}
                <div
                  aria-hidden
                  className={`absolute inset-[2px] rounded-[26px] backdrop-blur-2xl ${
                    isRecommended ? "bg-slate-900/90" : "bg-slate-900/70"
                  }`}
                />
                {/* Tail — fixed size, doesn't scale with card height */}
                <div
                  aria-hidden
                  className="absolute w-[22px] h-[22px] rounded-[5px] rotate-45"
                  style={{
                    right: "-9px",
                    top: "50%",
                    marginTop: "-11px",
                    background: isRecommended
                      ? "linear-gradient(135deg, #a855f7, #ec4899)"
                      : "rgba(255,255,255,0.14)",
                  }}
                />
                <div
                  aria-hidden
                  className={`absolute w-[18px] h-[18px] rounded-[4px] rotate-45 ${
                    isRecommended ? "bg-slate-900" : "bg-slate-900"
                  }`}
                  style={{ right: "-7px", top: "50%", marginTop: "-9px" }}
                />

                <div className="relative flex flex-col flex-1 p-6">
                {isRecommended && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                    Most Popular
                  </div>
                )}

                {showDiscountBadge && !isCurrentPlan && (
                  <div className="absolute -top-3 -right-3 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30 animate-pulse">
                    -{discount}%
                  </div>
                )}

                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-xs text-slate-400 mb-5">{plan.tagline}</p>

                <div className="mb-1 flex items-end gap-2">
                  {showDiscountBadge && plan.waPrice > 0 && (
                    <span className="text-sm text-slate-500 line-through mb-1">${plan.waPrice.toFixed(2)}</span>
                  )}
                  <span className="text-4xl font-black tracking-tight">{price === 0 ? "$0" : `$${price.toFixed(2)}`}</span>
                  {price > 0 && <span className="text-slate-400 text-sm mb-1">/mo</span>}
                </div>

                {plan.key === "lite" && !isUpgrade && (
                  <p className="text-[11px] text-slate-500 mb-4">{channel === "whatsapp" ? "7-day free trial" : "Free, forever"}</p>
                )}
                {(plan.key !== "lite" || isUpgrade) && <div className="mb-4" />}

                {showTelegramNudge && !isCurrentPlan && (
                  <button
                    onClick={() => setChannel("telegram")}
                    className="mb-4 -mt-3 text-left text-[11px] text-sky-400 hover:text-sky-300 underline underline-offset-2 transition"
                  >
                    Save {discount}% on Telegram →
                  </button>
                )}

                <ul className="space-y-2 mb-6 flex-1">
                  {FEATURES.map((f) => {
                    const val = plan.key === "lite" ? f.lite : plan.key === "core" ? f.core : f.max;
                    if (val === "—") return null;
                    return (
                      <li key={f.label} className="flex items-center gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>
                          {f.label} {val !== "✓" && <span className="text-slate-500">({val})</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* CTA — behavior differs by mode */}
                {isUpgrade ? (
                  isCurrentPlan ? (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-slate-400">
                      Current Plan
                    </div>
                  ) : isDowngrade ? (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-slate-500">
                      Included
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgradeCheckout(plan.key)}
                      disabled={checkoutLoading !== null}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition transform active:scale-[0.98] disabled:opacity-60 ${
                        isRecommended
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:opacity-90"
                          : "bg-white/5 border border-white/15 text-white hover:bg-white/10"
                      }`}
                    >
                      {checkoutLoading === plan.key ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Upgrade Now <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )
                ) : (
                  <Link
                    href={`/register?plan=${plan.key}&channel=${channel}`}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition transform active:scale-[0.98] ${
                      isRecommended
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:opacity-90"
                        : "bg-white/5 border border-white/15 text-white hover:bg-white/10"
                    }`}
                  >
                    {plan.key === "lite" ? "Start Free" : "Get Started"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Feature Comparison Table */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Full feature comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 font-medium">Feature</th>
                  <th className="px-4 py-3 font-medium text-center">Lite</th>
                  <th className="px-4 py-3 font-medium text-center">Core</th>
                  <th className="px-4 py-3 font-medium text-center">Max</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, i) => (
                  <tr key={f.label} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
                    <td className="px-6 py-3 text-xs text-slate-300 flex items-center gap-2">
                      <f.icon className="w-3.5 h-3.5 text-purple-400 shrink-0" /> {f.label}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <FeatureCell value={f.lite} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <FeatureCell value={f.core} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <FeatureCell value={f.max} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingContent />
    </Suspense>
  );
}