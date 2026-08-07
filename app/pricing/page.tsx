"use client";

import React from "react";
import Link from "next/link";
import { 
  Check, 
  X, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Bot 
} from "lucide-react";

const PRICING_PLANS = [
  {
    id: "free",
    name: "BROO LITE",
    price: "$0.00",
    period: "/ month",
    badge: "Free Forever",
    description: "Ideal for basic daily expense tracking on WhatsApp.",
    highlight: false,
    buttonText: "Get Started Free",
    buttonClass: "bg-slate-800 hover:bg-slate-700 text-white border border-white/10",
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
    name: "BROO CORE",
    price: "$2.55",
    period: "/ month",
    badge: "MOST POPULAR",
    description: "Ideal for active spenders & daily users.",
    highlight: true,
    buttonText: "Upgrade to Broo Core",
    buttonClass: "bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black shadow-lg shadow-emerald-500/20",
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
    name: "BROO MAX",
    price: "$5.99",
    period: "/ month",
    badge: "POWER USERS",
    description: "For freelancers, business owners & power users.",
    highlight: false,
    buttonText: "Get Broo Max",
    buttonClass: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold shadow-lg shadow-purple-500/25",
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

export default function PricingPage() {
  return (
    <main className="min-h-screen w-full bg-[#07090e] text-white flex flex-col justify-between relative overflow-hidden font-sans py-12 px-4 md:px-8">
      
      {/* Background Glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-80 h-80 bg-pink-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full z-10">
        
        {/* Navigation Bar */}
        <div className="flex justify-between items-center mb-12">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight hover:opacity-90 transition">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Broo<span className="text-purple-400">.ai</span>
            </span>
          </Link>

          <Link 
            href="/register?plan=free"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition"
          >
            Dashboard Login
          </Link>
        </div>

        {/* Section Header */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Flexible Plans
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
            Simple, Transparent Pricing
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
            Pick the perfect plan for your budgeting and tracking needs.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
                plan.highlight
                  ? "bg-slate-900/90 border-2 border-emerald-400/80 shadow-[0_0_40px_0_rgba(52,211,153,0.15)] scale-[1.02]"
                  : "bg-slate-900/50 border border-white/10 hover:border-white/20"
              }`}
            >
              {/* Highlight Badge */}
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-400 text-slate-950 font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3" />
                  {plan.badge}
                </div>
              )}

              <div>
                {/* Header */}
                <div className="mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    {plan.name}
                  </span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl md:text-5xl font-black tracking-tight text-white">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {plan.period}
                    </span>
                  </div>
                  {!plan.highlight && (
                    <p className="text-[11px] text-purple-300 font-medium mt-1">
                      {plan.badge}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {plan.description}
                  </p>
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

              {/* Action Button */}
              <Link
                href={`/register?plan=${plan.id}`}
                className={`w-full py-3.5 px-4 rounded-xl text-center text-xs tracking-wider uppercase font-bold transition flex items-center justify-center gap-2 cursor-pointer ${plan.buttonClass}`}
              >
                <span>{plan.buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* Security / Trust Footer */}
        <div className="mt-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted payment processing via LemonSqueezy. Cancel anytime.</span>
        </div>

      </div>

      <div className="pt-8" />
    </main>
  );
}