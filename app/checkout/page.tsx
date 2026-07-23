'use client';

import { useState } from 'react';
import { CheckCircle2, ShieldCheck, Zap, Lock } from 'lucide-react';

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID,
          userId: 'USER_SUPABASE_ID', // Supabase logged-in User ID
          userEmail: 'user@example.com', // Supabase logged-in User Email
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Lemon Squeezy Checkout Page එකට Redirect වෙනවා
      }
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-6">
      
      {/* 🌟 Glass Card Container */}
      <div className="relative w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl shadow-purple-500/10 text-white overflow-hidden">
        
        {/* Subtle Background Glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5" />
          Pro Subscription
        </div>

        {/* Header */}
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Pro Plan Unlimited
        </h2>
        <p className="text-sm text-slate-300 mb-6">
          Upgrade your account to unlock all premium finance tracking features.
        </p>

        {/* Price Tag */}
        <div className="flex items-baseline gap-1 my-6 pb-6 border-b border-white/10">
          <span className="text-4xl font-black text-white">LKR 200</span>
          <span className="text-sm text-slate-400">/ month</span>
        </div>

        {/* Features List */}
        <div className="space-y-3.5 mb-8">
          {[
            'Unlimited Expense Tracking',
            'Instant WhatsApp Bot Access',
            'Detailed Financial Reports',
            'Priority 24/7 Support',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm text-slate-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl font-bold text-slate-900 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-slate-900 border-t-transparent" />
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Proceed to Checkout
            </>
          )}
        </button>

        {/* Footer Security Note */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Secured by Lemon Squeezy (SSL Encrypted)</span>
        </div>

      </div>
    </div>
  );
}