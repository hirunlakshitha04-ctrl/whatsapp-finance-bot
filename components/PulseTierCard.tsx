"use client";

import React, { useState } from "react";
import { Zap, Check, Mic, Camera, LayoutDashboard, Edit3, Mail, Loader2 } from "lucide-react";

interface PulseTierCardProps {
  userEmail?: string;
  userPhone?: string;
  variantId?: string;
}

export default function PulseTierCard({
  userEmail = "user@example.com",
  userPhone,
  variantId,
}: PulseTierCardProps) {
  const [loading, setLoading] = useState(false);

  // ⚡ Step 5: Trigger Lemon Squeezy Payment Gateway
  const handleUpgrade = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          phone: userPhone,
          variantId: variantId || process.env.NEXT_PUBLIC_LEMON_PRO_MONTHLY_VARIANT_ID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(`Checkout failed: ${errorData.error || "Unknown error"}`);
        return;
      }

      const paymentData = await response.json();

      // Redirect to Lemon Squeezy Checkout Page
      if (paymentData.url) {
        window.location.href = paymentData.url;
      } else {
        alert("Checkout URL missing in response.");
      }
    } catch (error) {
      console.error("Upgrade Error:", error);
      alert("Something went wrong with the payment request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-sm rounded-[32px] p-8 bg-slate-900/60 border-2 border-emerald-500/80 shadow-2xl shadow-emerald-500/10 backdrop-blur-3xl flex flex-col justify-between">
      {/* Most Popular Badge */}
      <div className="absolute top-4 right-4 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
        <Zap size={12} fill="currentColor" /> Most Popular
      </div>

      <div>
        {/* Card Header */}
        <div className="mb-6">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            Tier 2
          </span>
          <h3 className="text-2xl font-black text-white mt-1">Pulse</h3>
          <p className="text-xs text-slate-400 mt-1">
            For power users who need complete financial tracking automation.
          </p>
        </div>

        {/* Pricing */}
        <div className="mb-6 flex items-baseline gap-2">
          <span className="text-3xl font-black text-white">Rs 690</span>
          <span className="text-sm font-semibold text-slate-400">/ month</span>
          <span className="text-xs font-bold text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            ~$2.30
          </span>
        </div>

        <div className="w-full h-[1px] bg-slate-800 mb-6" />

        {/* Features List */}
        <div className="space-y-3.5">
          <p className="text-xs font-bold text-slate-300">
            Everything in <span className="text-emerald-400">Nudge</span>, plus:
          </p>

          <ul className="space-y-3 text-xs text-slate-300 font-medium">
            <li className="flex items-center gap-3">
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Mic size={14} />
              </div>
              <span>Unlimited voice note logging 🎙️</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Camera size={14} />
              </div>
              <span>Unlimited receipt photo scanning 📸</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Check size={14} />
              </div>
              <span>Category-wise breakdown (Food, Transport...)</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <LayoutDashboard size={14} />
              </div>
              <span>Web dashboard (view + edit entries)</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Edit3 size={14} />
              </div>
              <span>Confirm/Edit accuracy flow</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Mail size={14} />
              </div>
              <span>Email support</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Connected Action Button */}
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full mt-8 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs py-3.5 rounded-2xl transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Processing...
          </>
        ) : (
          <>Upgrade to Pulse ⚡</>
        )}
      </button>
    </div>
  );
}