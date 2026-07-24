"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "pro";
  const phone = searchParams.get("phone") || "";

  useEffect(() => {
    // 🎯 ඔයාගේ LemonSqueezy Checkout Links මෙතැනට යොදන්න
    const LEMONSQUEEZY_PLANS: Record<string, string> = {
      pro: "https://brooai.lemonsqueezy.com/checkout/buy/8263b48a-6d77-492d-a951-4d239bb57a15",
      yearly: "https://brooai.lemonsqueezy.com/checkout/buy/8263b48a-6d77-492d-a951-4d239bb57a15",
    };

    const baseUrl = LEMONSQUEEZY_PLANS[plan] || LEMONSQUEEZY_PLANS["pro"];
    
    // LemonSqueezy එකට User ගේ Phone Number එක Passthrough Parameter එකක් ලෙස යැවීම
    const checkoutUrl = `${baseUrl}?checkout[custom][phone]=${encodeURIComponent(phone)}`;

    // Automatic Redirect to LemonSqueezy
    const timer = setTimeout(() => {
      window.location.href = checkoutUrl;
    }, 1000); // 1 Second delay for smooth UI experience

    return () => clearTimeout(timer);
  }, [plan, phone]);

  return (
    <div className="relative min-h-screen bg-[#07090e] text-white flex items-center justify-center overflow-hidden px-4">
      
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-purple-950/20 flex flex-col items-center text-center">
        
        {/* Animated Loader Container */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 blur-md opacity-50 animate-pulse" />
          <div className="relative p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-purple-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Redirecting to Checkout
        </h2>

        {/* Subtext */}
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Please wait a moment while we set up your secure session with LemonSqueezy...
        </p>

        {/* Badges / Trust Elements */}
        <div className="w-full pt-4 border-t border-slate-800/60 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            256-bit Secure
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Broo.ai Pro
          </span>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090e] text-slate-400 flex items-center justify-center text-sm">
          Loading Checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}