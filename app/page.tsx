// app/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    setLoading(true);
    setError(null);

    // ෆෝන් නම්බර් එක E.164 standard එකට සකස් කිරීම (+94771234567)
    let formattedPhone = phone.trim().replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone.replace(/\D/g, '')}`;
    }

    try {
      // 1. යූසර් දැනටමත් රෙජිස්ටර් වෙලාද කියා බැලීම
      const { data: existingUser } = await supabase
        .from('users')
        .select('phone_number')
        .eq('phone_number', formattedPhone)
        .maybeSingle();

      // 2. අලුත් කෙනෙක් නම් Onboarding funnel එක user_sessions එකේ ස්ටාර්ට් කිරීම
      if (!existingUser) {
        await supabase.from('user_sessions').upsert({
          phone_number: formattedPhone,
          step: 'PENDING_NAME',
          onboarding_data: {},
          updated_at: new Date().toISOString()
        }, { onConflict: 'phone_number' });
      }

      // 3. Twilio WhatsApp බෝට් නම්බර් එක (Env වලින් හෝ Default එක)
      const systemWhatsAppNumber = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || '+14155238886';
      const cleanSystemNum = systemWhatsAppNumber.replace(/[^0-9]/g, '');
      
      // WhatsApp එකට යවන පළමු පණිවිඩය
      const welcomeText = existingUser 
        ? "Hello! I want to open my financial ledger." 
        : "Hello! I want to activate my global expense ledger account.";
        
      const encodedMsg = encodeURIComponent(welcomeText);
      
      // WhatsApp වෙබ් හෝ ඇප් එකට යොමු කිරීම
      window.location.href = `https://wa.me/${cleanSystemNum}?text=${encodedMsg}`;
    } catch (err) {
      console.error("Onboarding setup failure:", err);
      setError("Failed to initialize session. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Global Expense Tracker</h1>
        <p className="text-slate-500 mb-6 text-sm">Track budgets, debts, and bills worldwide via WhatsApp.</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              WhatsApp Number (with Country Code)
            </label>
            <input 
              type="tel" 
              placeholder="e.g., +94771234567" 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-sm"
          >
            {loading ? "Connecting..." : "Connect with WhatsApp"}
          </button>
        </form>
      </div>
    </div>
  );
}