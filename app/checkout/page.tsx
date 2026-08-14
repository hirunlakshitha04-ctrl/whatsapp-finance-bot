// app/checkout/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ShieldCheck, Sparkles, Loader2 } from "lucide-react";

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Setup: (options: { eventHandler: (event: { event?: string }) => void }) => void;
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "core";
  const phone = searchParams.get("phone") || "";
  // IMPORTANT: "direct" must be an EXPLICIT signal from the register flow,
  // never a default. If we default this to "direct", any other flow that
  // forgets to pass `type` (e.g. dashboard upgrade -> pricing -> checkout)
  // silently gets treated as "direct" too, and wrongly gets the auto
  // WhatsApp message. Default to "upgrade" (non-direct) instead.
  const type = searchParams.get("type") || "upgrade";

  // Lemon Squeezy Buy Links
  const LEMONSQUEEZY_PLANS: Record<string, string> = {
    core: "https://brooai.lemonsqueezy.com/checkout/buy/a54c9cf8-5ad7-416e-bfb2-dc503f724b56",
    max: "https://brooai.lemonsqueezy.com/checkout/buy/8263b48a-6d77-492d-a951-4d239bb57a15",
  };

  const baseUrl = LEMONSQUEEZY_PLANS[plan.toLowerCase()] || LEMONSQUEEZY_PLANS["core"];
  
  // Phone parameter එක සමඟ Success URL එක සැකසීම
  const successUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/payment-success?type=${type}&plan=${plan}&phone=${encodeURIComponent(phone)}` 
    : "";
  
  const separator = baseUrl.includes("?") ? "&" : "?";
  // NOTE: redirect_url query-param on a static Buy Link is NOT officially
  // supported by Lemon Squeezy (only the Checkout API honours it, and even
  // then it just relabels the confirmation button — it doesn't auto-redirect).
  // We keep it here as a best-effort hint, but we NEVER rely on it. The real
  // redirect happens via the Checkout.Success event handler below, which
  // works regardless of this param.
  const checkoutUrl = `${baseUrl}${separator}embed=1&checkout[custom][phone]=${encodeURIComponent(phone)}&checkout[product_options][redirect_url]=${encodeURIComponent(successUrl)}`;

  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    if (!successUrl) return;

    // If the overlay script already exists on the page (e.g. fast re-render,
    // back/forward nav), don't inject it twice — just wire up Setup again.
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://app.lemonsqueezy.com/js/checkout.js"]'
    );

    const wireUp = () => {
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Setup({
          eventHandler: (event) => {
            if (event.event === "Checkout.Success") {
              // This is the ONLY reliable auto-redirect path — it fires from
              // the overlay's postMessage event, independent of redirect_url.
              window.location.href = successUrl;
            }
          },
        });
        setScriptReady(true);
      }
    };

    if (existing) {
      // Script tag is there — LemonSqueezy global may already be set.
      if (window.LemonSqueezy) {
        wireUp();
      } else {
        existing.addEventListener("load", wireUp, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/checkout.js";
    script.async = true;
    script.onload = wireUp;
    script.onerror = () => setScriptFailed(true);
    document.body.appendChild(script);

    // Safety timeout: if the overlay script hasn't loaded after 6s (slow
    // network, blocked CDN, ad-blocker), stop showing "Loading..." and let
    // the user fall back to a plain hosted-checkout redirect. That fallback
    // will NOT auto-return to our success page, so we warn them.
    const timeout = setTimeout(() => {
      if (!window.LemonSqueezy) setScriptFailed(true);
    }, 6000);

    return () => clearTimeout(timeout);
  }, [successUrl]);

  const handleOpenCheckout = () => {
    if (window.LemonSqueezy) {
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } else {
      // Last-resort fallback only — Lemon Squeezy will NOT reliably auto
      // redirect back from here, so this path should be rare (only when the
      // overlay script truly failed to load).
      window.location.href = checkoutUrl;
    }
  };

  const buttonDisabled = !scriptReady && !scriptFailed;

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

        <button
          onClick={handleOpenCheckout}
          disabled={buttonDisabled}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.01] transition-all mb-6 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {buttonDisabled ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing secure checkout…
            </>
          ) : (
            "Proceed to Payment 🚀"
          )}
        </button>

        {scriptFailed && !scriptReady && (
          <p className="text-amber-400 text-xs -mt-3 mb-4">
            Secure checkout is taking longer than usual. You can still continue,
            but after paying you may need to tap &quot;Continue&quot; on the
            confirmation screen to return here.
          </p>
        )}

        <div className="w-full pt-4 border-t border-slate-800/60 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            256-bit Secure
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Brofinai Pro
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