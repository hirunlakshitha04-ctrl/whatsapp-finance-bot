// app/checkout/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ShieldCheck, Sparkles, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Paddle?: {
      Initialize: (options: { token: string; eventCallback?: (event: any) => void }) => void;
      Checkout: { open: (options: any) => void };
    };
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "core";
  const phone = searchParams.get("phone") || "";
  const type = searchParams.get("type") || "upgrade";
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const successUrl = typeof window !== "undefined"
    ? `${window.location.origin}/payment-success?type=${encodeURIComponent(type)}&plan=${encodeURIComponent(plan)}&phone=${encodeURIComponent(phone)}`
    : "";

  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://cdn.paddle.com/paddle/v2/paddle.js"]');
    const wire = () => {
      try {
        if (!window.Paddle) throw new Error("Paddle.js unavailable");
        window.Paddle.Initialize({ token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "" });
        setReady(true);
      } catch {
        setFailed(true);
      }
    };
    if (existing) {
      if (window.Paddle) wire();
      else existing.addEventListener("load", wire, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = wire;
    script.onerror = () => setFailed(true);
    document.body.appendChild(script);
    return () => script.remove();
  }, []);

  const handleOpenCheckout = () => {
    if (!window.Paddle) return;
    const priceId = plan.toLowerCase() === "max"
      ? process.env.NEXT_PUBLIC_PADDLE_MAX_MONTHLY_PRICE_ID || ""
      : process.env.NEXT_PUBLIC_PADDLE_CORE_MONTHLY_PRICE_ID || "";
    if (!priceId) {
      setFailed(true);
      return;
    }
    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      settings: { displayMode: "overlay", variant: "one-page", theme: "dark", successUrl },
      customData: { source: "checkout-page", plan, phone },
    });
  };

  return (
    <div className="relative min-h-screen bg-[#07090e] text-white flex items-center justify-center overflow-hidden px-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 blur-md opacity-50 animate-pulse" />
          <div className="relative p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-purple-400"><Sparkles className="w-8 h-8" /></div>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight mb-2 text-white">Ready for Checkout</h2>
        <p className="text-slate-400 text-sm mb-6">Click the button below to securely proceed with your payment.</p>
        <button onClick={handleOpenCheckout} disabled={!ready && !failed} className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.01] transition-all mb-6 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2">
          {!ready && !failed ? <><Loader2 className="w-4 h-4 animate-spin" />Preparing secure checkout…</> : "Proceed to Payment 🚀"}
        </button>
        {failed && <p className="text-amber-400 text-xs -mt-3 mb-4">Paddle Checkout could not initialize. Check your Paddle client token and approved domain.</p>}
        <div className="w-full pt-4 border-t border-slate-800/60 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" />256-bit Secure</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-purple-400" />Brofinai Pro</span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}><CheckoutContent /></Suspense>;
}
