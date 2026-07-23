"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Comprehensive Global Lists
const WORLD_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahrain", "Bangladesh", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Brazil",
  "Bulgaria", "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Dominican Republic", "Ecuador", "Egypt", "Estonia", "Ethiopia", "Finland", "France", "Georgia", "Germany",
  "Ghana", "Greece", "Guatemala", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Lebanon", "Malaysia",
  "Maldives", "Mexico", "Monaco", "Morocco", "Nepal", "Netherlands", "New Zealand", "Nigeria", "Norway", "Oman",
  "Pakistan", "Panama", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia",
  "Singapore", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland", "Taiwan", "Thailand",
  "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vietnam", "Zimbabwe"
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
  { code: "LKR", name: "LKR - Sri Lankan Rupee" },
  { code: "USD", name: "USD - US Dollar" },
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
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") || "free";

  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    address: "",
    country: "Sri Lanka",
    language: "si",
    currency: "LKR",
    nickname: "",
    privacy_accepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

    let cleanedPhone = formData.phone_number.replace(/[^0-9+]/g, "");
    if (!cleanedPhone.startsWith("+")) {
      cleanedPhone = `+${cleanedPhone}`;
    }

    try {
      // 1. Save user details into Supabase
      const { error } = await supabase.from("users").upsert(
        [
          {
            phone_number: cleanedPhone,
            name: formData.name,
            address: formData.address,
            country: formData.country,
            language: formData.language,
            currency: formData.currency,
            nickname: formData.nickname || formData.name,
            plan_type: planParam,
            is_paid: false, // Will become true after successful checkout for paid plans
          },
        ],
        { onConflict: "phone_number" }
      );

      if (error) throw error;

      // 2. Dynamic Redirect Flow based on Plan Type
      if (planParam === "free") {
        // Free Plan -> Directly to WhatsApp Bot
        const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "+14155238886";
        const defaultText = encodeURIComponent("Hi, I just registered!");
        const whatsappUrl = `https://wa.me/${botPhoneNumber.replace("+", "")}?text=${defaultText}`;
        window.location.href = whatsappUrl;
      } else {
        // Paid Plan (Pro/Business) -> Redirect to Checkout Page
        window.location.href = `/checkout?plan=${planParam}&phone=${encodeURIComponent(cleanedPhone)}`;
      }
    } catch (err: any) {
      console.error("Registration Error:", err);
      setErrorMsg(err.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-4xl p-6 md:p-10 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] text-white">
      {/* Header Bar */}
      <div className="flex justify-between items-center pb-6 border-b border-white/10 mb-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-black text-lg">
            $
          </div>
          <span className="font-bold tracking-wider text-xl bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
            GLOBAL EXPENSE
          </span>
        </div>
        <div className="text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
          {planParam} Plan
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side Info */}
        <div className="lg:col-span-5 space-y-4">
          <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
            Stop Money <br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Disappearing.
            </span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Connect your personal profile, select your local currency & language, and let AI track every expense seamlessly on WhatsApp.
          </p>
        </div>

        {/* Right Side Glass Form */}
        <div className="lg:col-span-7">
          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3 rounded-xl text-xs mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Row 1: Name & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-amber-400/80 mb-1 font-medium">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-amber-400/80 mb-1 font-medium">
                  WhatsApp Number *
                </label>
                <input
                  type="text"
                  name="phone_number"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+94771234567"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition"
                />
              </div>
            </div>

            {/* Row 2: Country & Nickname */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-amber-400/80 mb-1 font-medium">
                  Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition"
                >
                  {WORLD_COUNTRIES.map((c) => (
                    <option key={c} value={c} className="bg-gray-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-amber-400/80 mb-1 font-medium">
                  How to call you?
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  placeholder="Machan / Sir / Bro"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition"
                />
              </div>
            </div>

            {/* Row 3: Language & Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-amber-400/80 mb-1 font-medium">
                  Preferred Language
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition"
                >
                  {WORLD_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-gray-900 text-white">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-amber-400/80 mb-1 font-medium">
                  Base Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition"
                >
                  {WORLD_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code} className="bg-gray-900 text-white">
                      {curr.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-amber-400/80 mb-1 font-medium">
                Address (Optional)
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="City or Street Address"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition"
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
                className="w-4 h-4 accent-amber-500 rounded bg-black/50 border-white/20"
              />
              <label htmlFor="privacy" className="text-xs text-gray-400 cursor-pointer">
                I agree to the <span className="text-amber-400 underline">Privacy Policy</span> & Terms.
              </label>
            </div>

            {/* Dynamic Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold py-3 px-6 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition transform active:scale-95 disabled:opacity-50"
            >
              {loading
                ? "PROCESSING..."
                : planParam === "free"
                ? "START ON WHATSAPP 🚀"
                : "PROCEED TO PAYMENT 💳"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 bg-black overflow-hidden font-sans">
      {/* Background Glowing Ambient Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-orange-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-yellow-600/20 rounded-full blur-[130px] pointer-events-none" />

      <Suspense fallback={<div className="text-white text-sm">Loading Glass UI...</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}