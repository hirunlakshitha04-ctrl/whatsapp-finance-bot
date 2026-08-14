// app/payment-success/page.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

const MAX_RETRIES = 6;       // ~12 seconds total (webhook eka process wenna time denna)
const RETRY_DELAY_MS = 2000;

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");
  // Safety net: default to "direct" so a missing/stripped `type` param never
  // silently kills the auto WhatsApp message. Only dashboard-upgrade links
  // should explicitly pass type=upgrade (or anything other than "direct").
  const type = searchParams.get("type") || "direct";
  const fallbackPlan = searchParams.get("plan") || "core"; // URL fail unoth witharai me eka use wenne

  const [plan, setPlan] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "confirmed" | "pending" | "error">("loading");

  useEffect(() => {
    if (!phone) {
      // Phone number ekak nathnam DB eken check karanna beri nisa
      // URL param eka witharak trust karanna weii (best-effort fallback)
      setPlan(fallbackPlan);
      setStatus("confirmed");
      return;
    }

    let attempts = 0;
    let cancelled = false;

    const checkPlan = async () => {
      try {
        const res = await fetch(`/api/get-user-plan?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();

        if (cancelled) return;

        if (res.ok && data.found && data.payment_status === "PAID") {
          setPlan(data.plan);
          setStatus("confirmed");
          return;
        }

        // Thawama webhook eka process wela nathinam retry karanna
        attempts += 1;
        if (attempts < MAX_RETRIES) {
          setStatus("pending");
          setTimeout(checkPlan, RETRY_DELAY_MS);
        } else {
          // Retries okkoma ivarai, DB eken confirm karanna baruna
          // - URL param eken hari fallback ekak denna
          setPlan(fallbackPlan);
          setStatus("error");
        }
      } catch (err) {
        console.error("Plan check failed:", err);
        attempts += 1;
        if (attempts < MAX_RETRIES && !cancelled) {
          setTimeout(checkPlan, RETRY_DELAY_MS);
        } else if (!cancelled) {
          setPlan(fallbackPlan);
          setStatus("error");
        }
      }
    };

    checkPlan();
    return () => { cancelled = true; };
  }, [phone, fallbackPlan]);

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "+14155238886";

  const planName = plan
    ? plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase()
    : "";

  // type=direct kiyanne register flow eken (pricing -> register -> payment) awa kiyalayi.
  // Dashboard upgrade flow eken awa nam (type != direct) plain link ekak witharai - design ekatama.
  const isDirect = type === "direct";

  const whatsappLink = isDirect && plan
    ? `https://wa.me/${whatsappNumber.replace("+", "")}?text=${encodeURIComponent(`Hi Broo, I just registered on the ${planName} plan!`)}`
    : `https://wa.me/${whatsappNumber.replace("+", "")}`;

  if (status === "loading" || status === "pending") {
    return (
      <main className="min-h-screen bg-[#05060B] text-white flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-sm text-gray-400">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span>Confirming your payment…</span>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-[#05060B] flex items-center justify-center p-4 md:p-8 relative overflow-hidden`}
      style={{ fontFamily: 'var(--font-body)' }}
    >

      <div className="w-full max-w-[460px] relative animate-[fadeUp_0.6s_ease-out]">
        {/* Brand header, matching the site nav mark */}
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
            <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <rect x="4" y="8" width="16" height="12" rx="3" />
              <path strokeLinecap="round" d="M9 8V6a3 3 0 016 0v2M8 13.5h.01M16 13.5h.01" />
            </svg>
          </div>
          <span
            className="text-white text-xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Bro<span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-purple-400">FInAi</span>
          </span>
        </div>

        {/* "App window" card — same chrome as the hero product mockup */}
        <div className="rounded-[20px] bg-[#0B0D16] border border-white/[0.08] shadow-[0_30px_90px_-20px_rgba(168,85,247,0.25)] overflow-hidden">
          {/* Window chrome bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.015]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span
                className="text-emerald-400 text-[10px] font-medium tracking-wide"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Payment Confirmed
              </span>
            </div>
          </div>

          <div className="p-6 md:p-7">
            {/* Chat-bubble style confirmation, echoing the hero's message bubble */}
            <div className="rounded-2xl rounded-tl-sm bg-gradient-to-r from-emerald-600/25 to-teal-600/10 border border-emerald-500/20 px-4 py-3 mb-4 flex items-center gap-2.5">
              <span className="text-lg leading-none">🎉</span>
              <span className="text-white text-[14px] font-medium">
                Welcome aboard — you&apos;re on the <span className="text-emerald-300 font-semibold">{planName}</span> plan
              </span>
            </div>

            {/* Status card, matching the "EXPENSE LOGGED" pattern from the hero */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 mb-6">
              <div className="flex items-center gap-2 mb-3.5">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span
                  className="text-emerald-400 text-[11px] font-bold tracking-[0.1em] uppercase"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Account Upgraded
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-black/30 border border-white/[0.05] px-4 py-3">
                <div>
                  <div className="text-gray-500 text-[9px] tracking-[0.1em] uppercase mb-0.5" style={{ fontFamily: 'var(--font-mono)' }}>Active plan</div>
                  <div className="text-white text-[15px] font-semibold">{planName}</div>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400 text-[10px] font-semibold tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>Active</span>
                </span>
              </div>
            </div>

            <p className="text-gray-400 text-[13.5px] leading-relaxed mb-6">
              Tap below to connect your number and start logging on WhatsApp — no app to install.
            </p>

            {/* CTA, styled like the hero's pill button */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-[#04120C] font-bold text-[15px] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>Start on WhatsApp</span>
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 mt-6">
          <svg className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)' }}>End-to-end encrypted · Subscription by BroFInAi</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
    </main>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#05060B] text-white flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-sm text-gray-400">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span>Loading payment details…</span>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}