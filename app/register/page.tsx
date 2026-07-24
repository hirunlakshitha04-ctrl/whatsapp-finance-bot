"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { 
  Bot, 
  Sparkles, 
  User, 
  Phone, 
  Globe, 
  Smile, 
  Languages, 
  Coins, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2,
  Lock,
  Mail,
  KeyRound,
  Loader2
} from "lucide-react";

// Singleton Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const WORLD_COUNTRIES = [
  "United States", "Sri Lanka", "United Kingdom", "Australia", "Canada", "United Arab Emirates", 
  "Qatar", "Saudi Arabia", "Kuwait", "Singapore", "Malaysia", "India", "Germany", "France", "Italy", 
  "Japan", "South Korea", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", 
  "Armenia", "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium", "Belize", 
  "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Brazil", "Bulgaria", "Chile", "China", 
  "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Dominican Republic", 
  "Ecuador", "Egypt", "Estonia", "Ethiopia", "Finland", "Georgia", "Ghana", "Greece", "Guatemala", 
  "Honduras", "Hong Kong", "Hungary", "Iceland", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", 
  "Jamaica", "Jordan", "Kazakhstan", "Kenya", "Lebanon", "Maldives", "Mexico", "Monaco", "Morocco", 
  "Nepal", "Netherlands", "New Zealand", "Nigeria", "Norway", "Oman", "Pakistan", "Panama", "Peru", 
  "Philippines", "Poland", "Portugal", "Romania", "Russia", "South Africa", "Spain", "Sweden", 
  "Switzerland", "Taiwan", "Thailand", "Turkey", "Ukraine", "Uruguay", "Uzbekistan", "Vietnam", "Zimbabwe"
];

const WORLD_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "si", name: "සිංහල (Sinhala)" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "ar", name: "العربية (Arabic)" },
  { code: "es", name: "Español (Spanish)" },
  { code: "fr", name: "Français (French)" },
  { code: "de", name: "Deutsch (German)" },
  { code: "zh", name: "中文 (Chinese)" },
  { code: "hi", name: "हिन्दी (Hindi)" },
  { code: "pt", name: "Português (Portuguese)" },
  { code: "ru", name: "Русский (Russian)" },
  { code: "ja", name: "日本語 (Japanese)" },
  { code: "ko", name: "한국어 (Korean)" },
  { code: "it", name: "Italiano (Italian)" },
  { code: "nl", name: "Nederlands (Dutch)" },
  { code: "tr", name: "Türkçe (Turkish)" },
  { code: "ur", name: "اردو (Urdu)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "vi", name: "Tiếng Việt (Vietnamese)" },
  { code: "th", name: "ไทย (Thai)" }
];

const WORLD_CURRENCIES = [
  { code: "USD", name: "USD - US Dollar" },
  { code: "LKR", name: "LKR - Sri Lankan Rupee" },
  { code: "EUR", name: "EUR - Euro" },
  { code: "GBP", name: "GBP - British Pound" },
  { code: "AED", name: "AED - UAE Dirham" },
  { code: "SAR", name: "SAR - Saudi Riyal" },
  { code: "INR", name: "INR - Indian Rupee" },
  { code: "AUD", name: "AUD - Australian Dollar" },
  { code: "CAD", name: "CAD - Canadian Dollar" },
  { code: "SGD", name: "SGD - Singapore Dollar" },
  { code: "JPY", name: "JPY - Japanese Yen" },
  { code: "CNY", name: "CNY - Chinese Yuan" },
  { code: "QAR", name: "QAR - Qatari Riyal" },
  { code: "KWD", name: "KWD - Kuwaiti Dinar" },
  { code: "BHD", name: "BHD - Bahraini Dinar" },
  { code: "OMR", name: "OMR - Omani Rial" },
  { code: "MYR", name: "MYR - Malaysian Ringgit" },
  { code: "THB", name: "THB - Thai Baht" },
  { code: "NZD", name: "NZD - New Zealand Dollar" },
  { code: "CHF", name: "CHF - Swiss Franc" },
  { code: "RUB", name: "RUB - Russian Ruble" },
  { code: "KRW", name: "KRW - South Korean Won" },
  { code: "ZAR", name: "ZAR - South African Rand" },
  { code: "BRL", name: "BRL - Brazilian Real" },
  { code: "PKR", name: "PKR - Pakistani Rupee" },
  { code: "BDT", name: "BDT - Bangladeshi Taka" }
];

function RegisterForm() {
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") || "free";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone_number: "",
    address: "",
    country: "United States",
    language: "en",
    currency: "USD",
    nickname: "",
    privacy_accepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (!formData.privacy_accepted) {
      setErrorMsg("Please accept the Privacy Policy to proceed.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    let cleanedPhone = formData.phone_number.replace(/[^0-9+]/g, "");
    if (!cleanedPhone.startsWith("+")) {
      cleanedPhone = `+${cleanedPhone}`;
    }

    try {
      // 🎯 Calculate 7-Day Free Trial Expiry Date
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      // 1. Supabase Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone_number: cleanedPhone,
          }
        }
      });

      if (authError) throw authError;

      // 2. Database Users Table Record (Updated with 7-Day Free Trial)
      const { error: dbError } = await supabase.from("users").upsert(
        [
          {
            id: authData.user?.id, // Link with Supabase Auth ID if available
            email: formData.email,
            phone_number: cleanedPhone,
            name: formData.name,
            address: formData.address,
            country: formData.country,
            language: formData.language,
            currency: formData.currency,
            nickname: formData.nickname || formData.name,
            plan_type: planParam,
            is_paid: false,

            // 🎯 STEP 02 ADDITIONS: Trial Status & Expiry Date
            trial_ends_at: trialEndsAt.toISOString(),
            subscription_status: "trial",
          },
        ],
        { onConflict: "phone_number" }
      );

      if (dbError) throw dbError;

      // 3. Redirect Logic
      if (planParam === "free") {
        const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "+14155238886";
        const defaultText = encodeURIComponent("Hi Broo, I just registered!");
        const whatsappUrl = `https://wa.me/${botPhoneNumber.replace("+", "")}?text=${defaultText}`;
        window.location.href = whatsappUrl;
      } else {
        window.location.href = `/checkout?plan=${planParam}&phone=${encodeURIComponent(cleanedPhone)}`;
      }
    } catch (err: any) {
      console.error("Registration Error:", err);
      setErrorMsg(err.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        <span className="text-xs font-mono uppercase tracking-wider">Loading Broo.ai Form...</span>
      </div>
    );
  }

  return (
    <div 
      className="relative z-10 w-full max-w-4xl p-6 md:p-10 rounded-3xl bg-slate-900/70 backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_0_rgba(0,0,0,0.8)] text-white"
      suppressHydrationWarning
    >
      
      {/* Header Bar */}
      <div className="flex justify-between items-center pb-6 border-b border-white/10 mb-8">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Broo<span className="text-purple-400">.ai</span>
          </span>
        </Link>
        <div className="text-xs uppercase tracking-widest px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          {planParam} Plan
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side Info */}
        <div className="lg:col-span-5 space-y-6">
          <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
            Stop Money <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Disappearing.
            </span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Connect your personal profile, select your local currency & language, and let <b>Broo.ai</b> track every expense seamlessly on WhatsApp.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero manual entry required</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Instant AI receipt scanner & parser</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Multi-currency real-time budgeting</span>
            </div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="lg:col-span-7">
          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3.5 rounded-xl text-xs mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            
            {/* Row 1: Name & WhatsApp Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-purple-300 mb-1 font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" /> Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-purple-300 mb-1 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Number *
                </label>
                <input
                  type="text"
                  name="phone_number"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+14155238886"
                  suppressHydrationWarning
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>
            </div>

            {/* Row 2: Email & Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-purple-300 mb-1 font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-400" /> Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-purple-300 mb-1 font-medium flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>
            </div>

            {/* Row 3: Country & Nickname */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-purple-300 mb-1 font-medium flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-pink-400" /> Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  suppressHydrationWarning
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                >
                  {WORLD_COUNTRIES.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-purple-300 mb-1 font-medium flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-amber-400" /> How to call you?
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  placeholder="John / Bro / Buddy"
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>
            </div>

            {/* Row 4: Language & Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-purple-300 mb-1 font-medium flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-cyan-400" /> Preferred Language
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  suppressHydrationWarning
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                >
                  {WORLD_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-purple-300 mb-1 font-medium flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-400" /> Base Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  suppressHydrationWarning
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                >
                  {WORLD_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code} className="bg-slate-900 text-white">
                      {curr.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-purple-300 mb-1 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Address (Optional)
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="City or Street Address"
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>

            {/* Privacy Checkbox */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="privacy"
                name="privacy_accepted"
                checked={formData.privacy_accepted}
                onChange={handleChange}
                className="w-4 h-4 accent-purple-500 rounded bg-slate-950 border-white/20 cursor-pointer"
              />
              <label htmlFor="privacy" className="text-xs text-slate-400 cursor-pointer">
                I agree to the <span className="text-purple-300 underline">Privacy Policy</span> & Terms.
              </label>
            </div>

            {/* Dynamic Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/20 hover:opacity-90 transition transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>CREATING ACCOUNT...</span>
              ) : planParam === "free" ? (
                <>
                  <span>START ON WHATSAPP 🚀</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>PROCEED TO PAYMENT 💳</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-8 pt-4 border-t border-white/5 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>End-to-End Encrypted Data Security by Broo.ai</span>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 bg-[#07090e] overflow-hidden font-sans">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-pink-600/25 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-600/20 rounded-full blur-[130px] pointer-events-none" />

      <Suspense fallback={<div className="text-white text-sm">Loading Broo.ai Form...</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}