// app/checkout/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";

declare global {
  interface Window {
    createLemonSqueezy?: any;
    LemonSqueezy?: any;
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "pro";
  const phone = searchParams.get("phone") || "";

  useEffect(() => {
    const LEMONSQUEEZY_PLANS: Record<string, string> = {
      pro: "https://brooai.lemonsqueezy.com/checkout/buy/8263b48a-6d77-492d-a951-4d239bb57a15",
      yearly: "https://brooai.lemonsqueezy.com/checkout/buy/8263b48a-6d77-492d-a951-4d239bb57a15",
    };

    const baseUrl = LEMONSQUEEZY_PLANS[plan] || LEMONSQUEEZY_PLANS["pro"];
    const successUrl = `${window.location.origin}/payment-success`;
    
    // URL එකට embed=1 එකතු කිරීම මඟින් එය modal එකක් ලෙස ක්‍රියාත්මක කරයි
    const checkoutUrl = `${baseUrl}?embed=1&checkout[custom][phone]=${encodeURIComponent(phone)}&checkout[redirect_url]=${encodeURIComponent(successUrl)}`;

    // Lemon Squeezy script එක load කිරීම
    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Setup({
          eventHandler: (event: any) => {
            if (event.event === "Checkout.Success") {
              // Payment එක සාර්ථක වූ වහාම අපේ success page එකට යැවීම
              window.location.href = successUrl;
            }
          },
        });
      }
    };

    // 1 තත්පරයකින් Lemon Squeezy overlay checkout එක aç කිරීම
    const timer = setTimeout(() => {
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Url.Open(checkoutUrl);
      } else {
        window.location.href = checkoutUrl;
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [plan, phone]);

  return (
    <div className="relative min-h-screen bg-[#07090e] text-white flex items-center justify-center overflow-hidden px-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 blur-md opacity-50 animate-pulse" />
          <div className="relative p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-purple-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight mb-2 text-white">
          Preparing Checkout
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Please wait a moment...
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}