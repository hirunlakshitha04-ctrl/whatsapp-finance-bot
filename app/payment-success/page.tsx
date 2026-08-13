// app/payment-success/page.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type"); // direct පේමන්ට් කළ අයෙක්දැයි බැලීමට[cite: 3]
  const plan = searchParams.get("plan") || "core"; // plan එක (core හෝ max)[cite: 3]

  // WhatsApp අංකය
  const whatsappNumber = "+14155238886"; 

  // Plan එකේ නම නිවැරදි කරගැනීම (Core හෝ Max)[cite: 3]
  const planName = plan.toLowerCase() === "max" ? "Max" : "Core";

  // Direct පේමන්ට් එකක් නම් පමණක් මැසේජ් එක සමඟ ලින්ක් එක සැකසීම, නැතහොත් පිරිසිදු ලින්ක් එක ලබා දීම[cite: 3]
  const whatsappLink = type === "direct" 
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi Broo, I just registered on the ${planName} plan!`)}`
    : `https://wa.me/${whatsappNumber}`;

  return (
    <main className="min-h-screen bg-[#07070B] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,50,190,0.15),rgba(255,255,255,0))] flex items-center justify-center p-4">
      {/* Glassmorphism Card */}
      <div className="w-full max-w-[650px] bg-[#0C0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-8 md:p-12 shadow-2xl relative overflow-hidden text-center">
        
        {/* Top Glow Accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo / Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 font-bold">
            🤖
          </div>
          <span className="text-white text-xl font-bold tracking-tight">Broo<span className="text-cyan-400">.ai</span></span>
        </div>

        {/* Success Icon / Badge */}
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner animate-bounce duration-1000">
          🎉
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
          Payment <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Successful!</span>
        </h1>

        {/* Description */}
        <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-[480px] mx-auto mb-8">
          Thank you for subscribing. Your account has been upgraded successfully. Click below to connect your profile and start tracking instantly on WhatsApp.
        </p>

        {/* Professional Green WhatsApp CTA Button */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold text-base shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.01] transition-all duration-200 transform active:scale-[0.99] mb-6 border border-emerald-400/30"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span className="tracking-wide">START ON WHATSAPP 🚀</span>
        </a>

        {/* Footer Security Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-4 border-t border-white/[0.04]">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>End-to-End Encrypted Subscription by Broo.ai</span>
        </div>

      </div>
    </main>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07070B] text-white flex items-center justify-center">Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}