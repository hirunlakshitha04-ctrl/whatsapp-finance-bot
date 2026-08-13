// app/checkout/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";

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
  
  // URL එකෙන් එන type එක ලබා ගැනීම (නැත්නම් ඩිෆෝල්ට් එකට direct ලෙස ගැනීම)[cite: 4]
  const type = searchParams.get("type") || "direct";

  const LEMONSQUEEZY_PLANS: Record<string, string> = {
    pro: "https://brooai.lemonsqueezy.com/checkout/buy/8263b48a-6d77-492d-a951-4d239bb57a15",
    yearly: "https://brooai.lemonsqueezy.com/checkout/buy/8263b48a-6d77-492d-a951-4d239bb57a15",
  };

  const baseUrl = LEMONSQUEEZY_PLANS[plan] || LEMONSQUEEZY_PLANS["pro"];
  
  // ලබාගත් type අගය successUrl එක වෙත යැවීම[cite: 4]
  const successUrl = `${window.location.origin}/payment-success?type=${type}&plan=${plan}`;
  
  // 🎯 නිවැරදි Lemon Squeezy Parameter එක: checkout[product_options][redirect_url][cite: 4]
  const checkoutUrl = `${baseUrl}?embed=1&checkout[custom][phone]=${encodeURIComponent(phone)}&checkout[product_options][redirect_url]=${encodeURIComponent(successUrl)}`;

  useEffect(() => {
    // Lemon Squeezy script එක load කිරීම[cite: 4]
    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Setup({
          eventHandler: (event: any) => {
            if (event.event === "Checkout.Success") {
              // Payment එක සාර්ථක වූ වහාම අපේ success page එකට යැවීම[cite: 4]
              window.location.href = successUrl;
            }
          },
        });
      }
    };

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [successUrl]);

  // බටන් එක ක්ලික් කළ විට පමණක් Lemon Squeezy Checkout එක ඕපන් වීම
  const handleOpenCheckout = () => {
    if (window.LemonSqueezy) {
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } else {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#07090e] text-white flex items-center justify-center overflow-hidden px-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
        
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 blur-md opacity-50 animate-pulse" />
          <div className="relative p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-purple-400">
            <Sparkles className="w-8 h-8" />
          </div>
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight mb-2 text-white">
          Ready for Checkout
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Click the button below to securely proceed with your payment.
        </p>

        {/* Proceed to Payment Button */}
        <button
          onClick={handleOpenCheckout}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.01] transition-all mb-6 cursor-pointer"
        >
          Proceed to Payment 🚀
        </button>

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
    <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}