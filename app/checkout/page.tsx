"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { ShieldCheck, Sparkles, Loader2 } from "lucide-react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("_ptxn") || searchParams.get("transaction_id") || "";
  const plan = searchParams.get("plan") || "core";
  const phone = searchParams.get("phone") || "";
  const type = searchParams.get("type") || "upgrade";
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "";
    const environment = token.startsWith("test_")
      ? "sandbox"
      : token.startsWith("live_")
      ? "production"
      : null;

    if (!transactionId) {
      setError("No Paddle transaction was provided.");
      return;
    }
    if (!token) {
      setError("Payment setup is incomplete: Paddle client token is missing.");
      return;
    }

    if (!environment) {
      setError("Payment setup error: Paddle client token must start with test_ or live_.");
      return;
    }

    initializePaddle({ environment, token })
      .then((paddle: Paddle | undefined) => {
        if (cancelled || !paddle) return;
        setReady(true);
        paddle.Checkout.open({
          transactionId,
          settings: {
            displayMode: "overlay",
            variant: "one-page",
            theme: "light",
            successUrl: `${window.location.origin}/payment-success?type=${encodeURIComponent(type)}&plan=${encodeURIComponent(plan)}&phone=${encodeURIComponent(phone)}`,
          },
        });
      })
      .catch((err) => {
        console.error("Paddle checkout initialization failed:", err);
        if (!cancelled) setError("Secure checkout could not load. Please try again.");
      });

    return () => {
      cancelled = true;
    };
  }, [transactionId, type, plan, phone]);

  return (
    <div className="relative min-h-screen bg-[#07090e] text-white flex items-center justify-center overflow-hidden px-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 blur-md opacity-50 animate-pulse" />
          <div className="relative p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-purple-400"><Sparkles className="w-8 h-8" /></div>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight mb-2 text-white">Secure Checkout</h2>
        {!error && !ready && <p className="text-slate-400 text-sm mb-6 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Preparing secure checkout…</p>}
        {error && <p className="text-amber-400 text-sm mb-6">{error}</p>}
        <div className="w-full pt-4 border-t border-slate-800/60 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" />256-bit Secure</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-purple-400" />Brofinai</span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}><CheckoutContent /></Suspense>;
}
