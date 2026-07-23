"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  price: string;
  billing: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free Tracker",
    price: "$0",
    billing: "Forever Free",
    description: "Perfect for individuals looking to start tracking daily expenses simply.",
    features: [
      "Track up to 50 expenses/mo",
      "WhatsApp AI Text Parsing",
      "Basic Monthly Reports",
      "Single Currency Support",
      "Standard Community Support",
    ],
    buttonText: "Get Started Free",
  },
  {
    id: "pro",
    name: "Pro Unlimited",
    price: "$4.99",
    billing: "per month",
    popular: true,
    description: "Ideal for power users who want unlimited tracking, vision OCR, and custom currencies.",
    features: [
      "Unlimited Expense & Income Logging",
      "Image/Receipt Photo OCR Parsing 📸",
      "All Global Currencies & Languages",
      "Budget Limits & Alert Warnings",
      "Export Data to Excel / CSV",
      "Priority WhatsApp AI Support",
    ],
    buttonText: "Start Pro Plan 🚀",
  },
  {
    id: "business",
    name: "Business & Teams",
    price: "$14.99",
    billing: "per month",
    description: "For small business owners and freelancers tracking multiple revenue streams.",
    features: [
      "Everything in Pro",
      "Multi-user Team Tracking",
      "Client Loan & Debt Management",
      "Advanced AI Monthly Analytics",
      "Customized Monthly PDF Receipts",
      "24/7 Dedicated Support",
    ],
    buttonText: "Go Business 💼",
  },
];

export default function PlansPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handleSelectPlan = (planId: string) => {
    // Navigate to register page passing chosen plan as query parameter
    router.push(`/register?plan=${planId}`);
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-6 bg-black text-white font-sans overflow-hidden">
      {/* Background Glowing Ambient Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-orange-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-yellow-600/20 rounded-full blur-[130px] pointer-events-none" />

      {/* Header Section */}
      <div className="relative z-10 text-center max-w-2xl mx-auto mb-12">
        <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-widest uppercase mb-4">
          Simple & Transparent Pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
          Choose the Perfect Plan for Your{" "}
          <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Financial Freedom.
          </span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base mt-4">
          No hidden fees. Change or cancel your plan anytime right from WhatsApp.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="mt-8 inline-flex items-center p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
              billingCycle === "monthly"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              billingCycle === "yearly"
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Yearly Billing
            <span className="bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[10px] px-2 py-0.5 rounded-full uppercase">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full items-stretch">
        {PLANS.map((plan) => {
          // Adjust price display if yearly is selected
          const calculatedPrice =
            billingCycle === "yearly" && plan.price !== "$0"
              ? `$${(parseFloat(plan.price.replace("$", "")) * 0.8 * 12).toFixed(2)}`
              : plan.price;

          const calculatedBilling =
            billingCycle === "yearly" && plan.price !== "$0"
              ? "per year (20% OFF)"
              : plan.billing;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between p-8 rounded-3xl bg-white/5 backdrop-blur-2xl border transition-all duration-300 hover:-translate-y-2 ${
                plan.popular
                  ? "border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.25)] bg-gradient-to-b from-amber-500/10 via-white/5 to-transparent"
                  : "border-white/10 hover:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]"
              }`}
            >
              {/* Popular Tag */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-lg">
                  MOST POPULAR 🔥
                </div>
              )}

              <div>
                {/* Plan Header */}
                <h2 className="text-xl font-bold text-white mb-2">{plan.name}</h2>
                <p className="text-gray-400 text-xs leading-relaxed min-h-[36px]">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="my-6">
                  <span className="text-4xl md:text-5xl font-black text-white">
                    {calculatedPrice}
                  </span>
                  <span className="text-xs text-gray-400 ml-2 font-medium">
                    / {calculatedBilling}
                  </span>
                </div>

                <hr className="border-white/10 mb-6" />

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-xs text-gray-300 gap-3">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-[10px] shrink-0">
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full font-black py-3.5 px-6 rounded-xl transition transform active:scale-95 shadow-lg ${
                  plan.popular
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/20"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}