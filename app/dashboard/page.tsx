"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ExcelJS from "exceljs";
import { motion } from "framer-motion";
import { 
  Wallet, TrendingUp, TrendingDown, RefreshCw, 
  PieChart as PieIcon, Calendar, RotateCcw,
  Sparkles, LogOut, Settings, LayoutDashboard,
  Download, CheckCircle2, AlertCircle, Edit2, Check, X, Lock, ShieldCheck, Zap, BarChart3, Filter, Ban, Trash2,
  User, Mail, Phone, Camera, Globe, DollarSign, Coins, Receipt, CreditCard, ChevronLeft, ChevronRight
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Transaction {
  id: string;
  type: "income" | "expense";
  item: string;
  category: string;
  amount: number;
  currency?: string;
  created_at: string;
  phone_number?: string;
  entry_type?: "ocr" | "text" | "manual";
}

// NOTE: These strings must match EXACTLY what extractTransaction() /
// extractFromImageBuffer() in finance-logic.ts return, otherwise the
// same real-world category (e.g. Transport) gets split into two rows
// in the dashboard breakdown because grouping is done by exact string match.
const CATEGORY_COLORS: { [key: string]: string } = {
  "Food & Groceries": "#F59E0B",
  "Transport (Bus, Train, Fuel, Taxi)": "#3B82F6",
  "Utilities (Bills, Internet, Phone)": "#EF4444",
  "Rent/Housing": "#22C55E",
  "Personal Care (Medical, Saloon, Hygiene)": "#06B6D4",
  "Shopping (Clothes, Gadgets)": "#EC4899",
  "Entertainment (Movies, Subscriptions, Outings)": "#8B5CF6",
  "Education (Books, Courses)": "#0EA5E9",
  "Debt/Loans": "#F97316",
  "Savings/Investments": "#10B981",
  "Gifts & Charity": "#D946EF",
  "Miscellaneous (Unexpected)": "#64748B",
  Salary: "#10B981",
  "Starting Balance": "#6366F1",
  Other: "#64748B"
};

const CATEGORY_OPTIONS = [
  "Food & Groceries",
  "Transport (Bus, Train, Fuel, Taxi)",
  "Utilities (Bills, Internet, Phone)",
  "Rent/Housing",
  "Personal Care (Medical, Saloon, Hygiene)",
  "Shopping (Clothes, Gadgets)",
  "Entertainment (Movies, Subscriptions, Outings)",
  "Education (Books, Courses)",
  "Debt/Loans",
  "Savings/Investments",
  "Gifts & Charity",
  "Miscellaneous (Unexpected)",
];

const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80"
];

const WORLD_CURRENCIES = [
  { code: "AFN", name: "AFN - Afghan Afghani" },
  { code: "ALL", name: "ALL - Albanian Lek" },
  { code: "DZD", name: "DZD - Algerian Dinar" },
  { code: "AOA", name: "AOA - Angolan Kwanza" },
  { code: "ARS", name: "ARS - Argentine Peso" },
  { code: "AMD", name: "AMD - Armenian Dram" },
  { code: "AWG", name: "AWG - Aruban Florin" },
  { code: "AUD", name: "AUD - Australian Dollar" },
  { code: "AZN", name: "AZN - Azerbaijani Manat" },
  { code: "BSD", name: "BSD - Bahamian Dollar" },
  { code: "BHD", name: "BHD - Bahraini Dinar" },
  { code: "BDT", name: "BDT - Bangladeshi Taka" },
  { code: "BBD", name: "BBD - Barbadian Dollar" },
  { code: "BYN", name: "BYN - Belarusian Ruble" },
  { code: "BZD", name: "BZD - Belize Dollar" },
  { code: "BMD", name: "BMD - Bermudan Dollar" },
  { code: "BTN", name: "BTN - Bhutanese Ngultrum" },
  { code: "BOB", name: "BOB - Bolivian Boliviano" },
  { code: "BAM", name: "BAM - Bosnia-Herzegovina Convertible Mark" },
  { code: "BWP", name: "BWP - Botswanan Pula" },
  { code: "BRL", name: "BRL - Brazilian Real" },
  { code: "GBP", name: "GBP - British Pound" },
  { code: "BND", name: "BND - Brunei Dollar" },
  { code: "BGN", name: "BGN - Bulgarian Lev" },
  { code: "BIF", name: "BIF - Burundian Franc" },
  { code: "KHR", name: "KHR - Cambodian Riel" },
  { code: "CAD", name: "CAD - Canadian Dollar" },
  { code: "CVE", name: "CVE - Cape Verdean Escudo" },
  { code: "KYD", name: "KYD - Cayman Islands Dollar" },
  { code: "XAF", name: "XAF - Central African CFA Franc" },
  { code: "XPF", name: "XPF - CFP Franc" },
  { code: "CLP", name: "CLP - Chilean Peso" },
  { code: "CNY", name: "CNY - Chinese Yuan" },
  { code: "COP", name: "COP - Colombian Peso" },
  { code: "KMF", name: "KMF - Comorian Franc" },
  { code: "CDF", name: "CDF - Congolese Franc" },
  { code: "CRC", name: "CRC - Costa Rican Colón" },
  { code: "HRK", name: "HRK - Croatian Kuna" },
  { code: "CUP", name: "CUP - Cuban Peso" },
  { code: "CZK", name: "CZK - Czech Koruna" },
  { code: "DKK", name: "DKK - Danish Krone" },
  { code: "DJF", name: "DJF - Djiboutian Franc" },
  { code: "DOP", name: "DOP - Dominican Peso" },
  { code: "XCD", name: "XCD - East Caribbean Dollar" },
  { code: "EGP", name: "EGP - Egyptian Pound" },
  { code: "ERN", name: "ERN - Eritrean Nakfa" },
  { code: "SZL", name: "SZL - Eswatini Lilangeni" },
  { code: "ETB", name: "ETB - Ethiopian Birr" },
  { code: "EUR", name: "EUR - Euro" },
  { code: "FJD", name: "FJD - Fijian Dollar" },
  { code: "GMD", name: "GMD - Gambian Dalasi" },
  { code: "GEL", name: "GEL - Georgian Lari" },
  { code: "GHS", name: "GHS - Ghanaian Cedi" },
  { code: "GTQ", name: "GTQ - Guatemalan Quetzal" },
  { code: "GNF", name: "GNF - Guinean Franc" },
  { code: "GYD", name: "GYD - Guyanaese Dollar" },
  { code: "HTG", name: "HTG - Haitian Gourde" },
  { code: "HNL", name: "HNL - Honduran Lempira" },
  { code: "HKD", name: "HKD - Hong Kong Dollar" },
  { code: "HUF", name: "HUF - Hungarian Forint" },
  { code: "ISK", name: "ISK - Icelandic Króna" },
  { code: "INR", name: "INR - Indian Rupee" },
  { code: "IDR", name: "IDR - Indonesian Rupiah" },
  { code: "IRR", name: "IRR - Iranian Rial" },
  { code: "IQD", name: "IQD - Iraqi Dinar" },
  { code: "ILS", name: "ILS - Israeli New Shekel" },
  { code: "JMD", name: "JMD - Jamaican Dollar" },
  { code: "JPY", name: "JPY - Japanese Yen" },
  { code: "JOD", name: "JOD - Jordanian Dinar" },
  { code: "KZT", name: "KZT - Kazakhstani Tenge" },
  { code: "KES", name: "KES - Kenyan Shilling" },
  { code: "KWD", name: "KWD - Kuwaiti Dinar" },
  { code: "KGS", name: "KGS - Kyrgystani Som" },
  { code: "LAK", name: "LAK - Laotian Kip" },
  { code: "LBP", name: "LBP - Lebanese Pound" },
  { code: "LSL", name: "LSL - Lesotho Loti" },
  { code: "LRD", name: "LRD - Liberian Dollar" },
  { code: "LYD", name: "LYD - Libyan Dinar" },
  { code: "MOP", name: "MOP - Macanese Pataca" },
  { code: "MKD", name: "MKD - Macedonian Denar" },
  { code: "MGA", name: "MGA - Malagasy Ariary" },
  { code: "MWK", name: "MWK - Malawian Kwacha" },
  { code: "MYR", name: "MYR - Malaysian Ringgit" },
  { code: "MVR", name: "MVR - Maldivian Rufiyaa" },
  { code: "MRU", name: "MRU - Mauritanian Ouguiya" },
  { code: "MUR", name: "MUR - Mauritian Rupee" },
  { code: "MXN", name: "MXN - Mexican Peso" },
  { code: "MDL", name: "MDL - Moldovan Leu" },
  { code: "MNT", name: "MNT - Mongolian Tugrik" },
  { code: "MAD", name: "MAD - Moroccan Dirham" },
  { code: "MZN", name: "MZN - Mozambican Metical" },
  { code: "MMK", name: "MMK - Myanmar Kyat" },
  { code: "NAD", name: "NAD - Namibian Dollar" },
  { code: "NPR", name: "NPR - Nepalese Rupee" },
  { code: "ANG", name: "ANG - Netherlands Antillean Guilder" },
  { code: "TWD", name: "TWD - New Taiwan Dollar" },
  { code: "NZD", name: "NZD - New Zealand Dollar" },
  { code: "NIO", name: "NIO - Nicaraguan Córdoba" },
  { code: "NGN", name: "NGN - Nigerian Naira" },
  { code: "KPW", name: "KPW - North Korean Won" },
  { code: "NOK", name: "NOK - Norwegian Krone" },
  { code: "OMR", name: "OMR - Omani Rial" },
  { code: "PKR", name: "PKR - Pakistani Rupee" },
  { code: "PAB", name: "PAB - Panamanian Balboa" },
  { code: "PGK", name: "PGK - Papua New Guinean Kina" },
  { code: "PYG", name: "PYG - Paraguayan Guarani" },
  { code: "PEN", name: "PEN - Peruvian Sol" },
  { code: "PHP", name: "PHP - Philippine Peso" },
  { code: "PLN", name: "PLN - Polish Złoty" },
  { code: "QAR", name: "QAR - Qatari Riyal" },
  { code: "RON", name: "RON - Romanian Leu" },
  { code: "RUB", name: "RUB - Russian Ruble" },
  { code: "RWF", name: "RWF - Rwandan Franc" },
  { code: "WST", name: "WST - Samoan Tala" },
  { code: "SAR", name: "SAR - Saudi Riyal" },
  { code: "RSD", name: "RSD - Serbian Dinar" },
  { code: "SCR", name: "SCR - Seychellois Rupee" },
  { code: "SLL", name: "SLL - Sierra Leonean Leone" },
  { code: "SGD", name: "SGD - Singapore Dollar" },
  { code: "SBD", name: "SBD - Solomon Islands Dollar" },
  { code: "SOS", name: "SOS - Somali Shilling" },
  { code: "ZAR", name: "ZAR - South African Rand" },
  { code: "KRW", name: "KRW - South Korean Won" },
  { code: "SSP", name: "SSP - South Sudanese Pound" },
  { code: "LKR", name: "LKR - Sri Lankan Rupee" },
  { code: "SDG", name: "SDG - Sudanese Pound" },
  { code: "SRD", name: "SRD - Surinamese Dollar" },
  { code: "SEK", name: "SEK - Swedish Krona" },
  { code: "CHF", name: "CHF - Swiss Franc" },
  { code: "SYP", name: "SYP - Syrian Pound" },
  { code: "STN", name: "STN - São Tomé and Príncipe Dobra" },
  { code: "TJS", name: "TJS - Tajikistani Somoni" },
  { code: "TZS", name: "TZS - Tanzanian Shilling" },
  { code: "THB", name: "THB - Thai Baht" },
  { code: "TOP", name: "TOP - Tongan Paʻanga" },
  { code: "TTD", name: "TTD - Trinidad and Tobago Dollar" },
  { code: "TND", name: "TND - Tunisian Dinar" },
  { code: "TRY", name: "TRY - Turkish Lira" },
  { code: "TMT", name: "TMT - Turkmenistani Manat" },
  { code: "AED", name: "AED - UAE Dirham" },
  { code: "UGX", name: "UGX - Ugandan Shilling" },
  { code: "UAH", name: "UAH - Ukrainian Hryvnia" },
  { code: "UYU", name: "UYU - Uruguayan Peso" },
  { code: "USD", name: "USD - US Dollar" },
  { code: "UZS", name: "UZS - Uzbekistani Som" },
  { code: "VUV", name: "VUV - Vanuatu Vatu" },
  { code: "VES", name: "VES - Venezuelan Bolívar" },
  { code: "VND", name: "VND - Vietnamese Đồng" },
  { code: "XOF", name: "XOF - West African CFA Franc" },
  { code: "YER", name: "YER - Yemeni Rial" },
  { code: "ZMW", name: "ZMW - Zambian Kwacha" }
];

const WORLD_LANGUAGES = [
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Shqip (Albanian)" },
  { code: "am", name: "አማርኛ (Amharic)" },
  { code: "ar", name: "العربية (Arabic)" },
  { code: "hy", name: "Հայերեն (Armenian)" },
  { code: "az", name: "Azərbaycan dili (Azerbaijani)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "bs", name: "Bosanski (Bosnian)" },
  { code: "bg", name: "Български (Bulgarian)" },
  { code: "my", name: "မြန်မာ (Burmese)" },
  { code: "zh", name: "中文 (Chinese)" },
  { code: "hr", name: "Hrvatski (Croatian)" },
  { code: "cs", name: "Čeština (Czech)" },
  { code: "da", name: "Dansk (Danish)" },
  { code: "nl", name: "Nederlands (Dutch)" },
  { code: "en", name: "English" },
  { code: "et", name: "Eesti (Estonian)" },
  { code: "tl", name: "Tagalog (Filipino)" },
  { code: "fi", name: "Suomi (Finnish)" },
  { code: "fr", name: "Français (French)" },
  { code: "ka", name: "ქართული (Georgian)" },
  { code: "de", name: "Deutsch (German)" },
  { code: "el", name: "Ελληνικά (Greek)" },
  { code: "gu", name: "ગુજરાતી (Gujarati)" },
  { code: "ha", name: "Hausa" },
  { code: "he", name: "עברית (Hebrew)" },
  { code: "hi", name: "हिन्दी (Hindi)" },
  { code: "hu", name: "Magyar (Hungarian)" },
  { code: "is", name: "Íslenska (Icelandic)" },
  { code: "ig", name: "Igbo" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ga", name: "Gaeilge (Irish)" },
  { code: "it", name: "Italiano (Italian)" },
  { code: "ja", name: "日本語 (Japanese)" },
  { code: "kn", name: "කන්නඩා (Kannada)" },
  { code: "kk", name: "Қазақ тілі (Kazakh)" },
  { code: "km", name: "ខ្មែរ (Khmer)" },
  { code: "ko", name: "한국어 (Korean)" },
  { code: "ku", name: "Kurdî (Kurdish)" },
  { code: "lo", name: "ລາວ (Lao)" },
  { code: "lv", name: "Latviešu (Latvian)" },
  { code: "lt", name: "Lietuvių (Lithuanian)" },
  { code: "mk", name: "Македонски (Macedonian)" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "mn", name: "Монгол (Mongolian)" },
  { code: "ne", name: "ਨੇपाली (Nepali)" },
  { code: "no", name: "Norsk (Norwegian)" },
  { code: "ps", name: "پښتو (Pashto)" },
  { code: "fa", name: "فارسی (Persian/Farsi)" },
  { code: "pl", name: "Polski (Polish)" },
  { code: "pt", name: "Português (Portuguese)" },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "ro", name: "Română (Romanian)" },
  { code: "ru", name: "Русский (Russian)" },
  { code: "sr", name: "Српски (Serbian)" },
  { code: "sd", name: "سنڌي (Sindhi)" },
  { code: "singlish", name: "Singlish (Sinhala + English mix)" },
  { code: "si", name: "සිංහල (Sinhala)" },
  { code: "sk", name: "Slovenčina (Slovak)" },
  { code: "sl", name: "Slovenščina (Slovenian)" },
  { code: "so", name: "Soomaali (Somali)" },
  { code: "es", name: "Español (Spanish)" },
  { code: "sw", name: "Kiswahili (Swahili)" },
  { code: "sv", name: "Svenska (Swedish)" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "th", name: "ไทย (Thai)" },
  { code: "tr", name: "Türkçe (Turkish)" },
  { code: "uk", name: "Українська (Ukrainian)" },
  { code: "ur", name: "اردو (Urdu)" },
  { code: "uz", name: "O'zbek tili (Uzbek)" },
  { code: "vi", name: "Tiếng Việt (Vietnamese)" },
  { code: "cy", name: "Cymraeg (Welsh)" },
  { code: "xh", name: "isiXhosa (Xhosa)" },
  { code: "yo", name: "Yorùbá (Yoruba)" },
  { code: "zu", name: "isiZulu (Zulu)" }
];

// Falling finance-icon background — same decorative effect used on the
// landing page. Dollar signs, wallets, coins etc. drop in inside circular
// badges and settle at a spot spread across the full height of the screen,
// each on its own staggered delay/cycle, then fade back out and repeat.
// Presets are hardcoded (not Math.random) so server-rendered and
// client-hydrated markup match exactly.
const FALLING_ICON_SET = [DollarSign, Wallet, Coins, TrendingUp, Receipt, CreditCard, PieIcon];

const FALLING_ICON_PRESETS: {
  icon: number;
  left: number;
  circleSize: number;
  iconSize: number;
  cycleDuration: number;
  delay: number;
  landY: string;
}[] = [
  { icon: 6, left: 2, circleSize: 58, iconSize: 25, cycleDuration: 14.8, delay: 6, landY: "87vh" },
  { icon: 0, left: 5, circleSize: 56, iconSize: 23, cycleDuration: 14.9, delay: 9.5, landY: "72vh" },
  { icon: 6, left: 9, circleSize: 42, iconSize: 18, cycleDuration: 15.7, delay: 1.6, landY: "25vh" },
  { icon: 3, left: 9, circleSize: 55, iconSize: 21, cycleDuration: 13.4, delay: 7.6, landY: "50vh" },
  { icon: 3, left: 15, circleSize: 62, iconSize: 26, cycleDuration: 10.4, delay: 8.8, landY: "20vh" },
  { icon: 1, left: 16, circleSize: 45, iconSize: 17, cycleDuration: 16.8, delay: 1.9, landY: "71vh" },
  { icon: 4, left: 23, circleSize: 55, iconSize: 21, cycleDuration: 9.5, delay: 4.2, landY: "34vh" },
  { icon: 5, left: 26, circleSize: 51, iconSize: 20, cycleDuration: 16.5, delay: 6.1, landY: "40vh" },
  { icon: 2, left: 27, circleSize: 59, iconSize: 25, cycleDuration: 15.1, delay: 9.8, landY: "55vh" },
  { icon: 3, left: 31, circleSize: 54, iconSize: 23, cycleDuration: 10.5, delay: 4.9, landY: "35vh" },
  { icon: 0, left: 31, circleSize: 48, iconSize: 19, cycleDuration: 16.7, delay: 0.6, landY: "47vh" },
  { icon: 2, left: 36, circleSize: 53, iconSize: 21, cycleDuration: 9.8, delay: 4.7, landY: "50vh" },
  { icon: 5, left: 39, circleSize: 52, iconSize: 22, cycleDuration: 15.7, delay: 9, landY: "44vh" },
  { icon: 0, left: 41, circleSize: 51, iconSize: 22, cycleDuration: 10.1, delay: 1.5, landY: "34vh" },
  { icon: 0, left: 49, circleSize: 52, iconSize: 23, cycleDuration: 16.3, delay: 5.7, landY: "49vh" },
  { icon: 3, left: 52, circleSize: 45, iconSize: 19, cycleDuration: 16.5, delay: 5.5, landY: "55vh" },
  { icon: 5, left: 51, circleSize: 57, iconSize: 24, cycleDuration: 12.2, delay: 8, landY: "73vh" },
  { icon: 3, left: 58, circleSize: 55, iconSize: 22, cycleDuration: 9.8, delay: 1.9, landY: "46vh" },
  { icon: 3, left: 58, circleSize: 57, iconSize: 22, cycleDuration: 12.1, delay: 3.7, landY: "61vh" },
  { icon: 1, left: 65, circleSize: 39, iconSize: 16, cycleDuration: 14.2, delay: 9.1, landY: "80vh" },
  { icon: 4, left: 64, circleSize: 57, iconSize: 25, cycleDuration: 13.8, delay: 2.6, landY: "34vh" },
  { icon: 5, left: 68, circleSize: 60, iconSize: 26, cycleDuration: 9.9, delay: 2.7, landY: "56vh" },
  { icon: 1, left: 72, circleSize: 45, iconSize: 19, cycleDuration: 15.6, delay: 4.1, landY: "46vh" },
  { icon: 1, left: 79, circleSize: 59, iconSize: 26, cycleDuration: 11.5, delay: 6.8, landY: "86vh" },
  { icon: 1, left: 83, circleSize: 53, iconSize: 21, cycleDuration: 9.3, delay: 1.6, landY: "33vh" },
  { icon: 4, left: 82, circleSize: 49, iconSize: 21, cycleDuration: 15.6, delay: 2.1, landY: "45vh" },
  { icon: 1, left: 88, circleSize: 56, iconSize: 24, cycleDuration: 10.4, delay: 3.8, landY: "35vh" },
  { icon: 5, left: 88, circleSize: 59, iconSize: 26, cycleDuration: 9.5, delay: 9.7, landY: "66vh" },
  { icon: 2, left: 96, circleSize: 48, iconSize: 21, cycleDuration: 13.6, delay: 2.3, landY: "71vh" },
  { icon: 4, left: 99, circleSize: 48, iconSize: 22, cycleDuration: 9.6, delay: 2.8, landY: "36vh" },
];

function FallingIcons() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden>
      {FALLING_ICON_PRESETS.map((p, i) => {
        const Icon = FALLING_ICON_SET[p.icon];
        // Small per-item variety so the fall doesn't look like a rigid straight
        // drop — a touch of sideways drift and rotation that reverses direction
        // based on index, plus a landing bounce that eases into a smooth,
        // bounce-free fade.
        const drift = (i % 2 === 0 ? 1 : -1) * (6 + (p.circleSize % 5));
        const spin = (i % 2 === 0 ? 1 : -1) * (8 + (p.iconSize % 6));

        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: `${p.left}%`, top: "-14%" }}
            initial={{ y: "-10vh", x: 0, opacity: 0, scale: 0.4, rotate: 0 }}
            animate={{
              y: ["-10vh", p.landY, p.landY, "-8vh"],
              x: [0, drift, drift, 0],
              opacity: [0, 1, 1, 0],
              scale: [0.4, 1, 1, 0.5],
              rotate: [0, spin, spin, spin * 1.4],
            }}
            transition={{
              duration: p.cycleDuration,
              delay: p.delay,
              repeat: Infinity,
              times: [0, 0.18, 0.82, 1], // quick fall in, long hold, gentle fade out
              ease: [
                [0.34, 1.56, 0.64, 1], // fall-in: slight overshoot, like settling on landing
                "easeInOut",           // hold: values are static here, so this segment is inert
                [0.4, 0, 0.2, 1],      // fade-out: smooth ease, no bounce
              ],
            }}
          >
            <div
              className="rounded-full bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white/30"
              style={{ width: p.circleSize, height: p.circleSize }}
            >
              <Icon style={{ width: p.iconSize, height: p.iconSize }} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function BrooDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "settings">("overview");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<string>("Rs.");
  const [nickname, setNickname] = useState<string>("Bro");
  const [userPhone, setUserPhone] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>(""); // Supabase Auth session UID (used for /pricing links etc.)
  const [dbUserId, setDbUserId] = useState<string>(""); // public.users.id — the FK target on transactions/budgets.user_id
  const [avatarUrl, setAvatarUrl] = useState<string>(AVATAR_OPTIONS[0]);
  const router = useRouter();

  const [appLanguage, setAppLanguage] = useState<string>("en");
  const [dateFormat, setDateFormat] = useState<string>("DD/MM/YYYY");
  const [weekStart, setWeekStart] = useState<string>("Monday");

  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("lite");
  const [linkedChannel, setLinkedChannel] = useState<"whatsapp" | "telegram" | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // 🎯 BUDGET STATES LOADED FROM SUPABASE
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [categoryBudgets, setCategoryBudgets] = useState<{ [key: string]: number }>({});
  const [isEditingBudget, setIsEditingBudget] = useState<boolean>(false);
  const [tempBudget, setTempBudget] = useState<string>("0");
  const [tempCatBudgets, setTempCatBudgets] = useState<{ [key: string]: string }>({});
  // Maps a category name -> its row id in the "budgets" table, so edits/renames/
  // deletes can target the exact Supabase row instead of guessing by category text.
  const [budgetRowIds, setBudgetRowIds] = useState<{ [key: string]: string }>({});
  // While editing, holds { originalCategory: newlyChosenCategory } for any category
  // the user re-labelled via the dropdown. Cleared on save/cancel.
  const [tempCatNames, setTempCatNames] = useState<{ [key: string]: string }>({});
  const [deletingBudgetCat, setDeletingBudgetCat] = useState<string | null>(null);

  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [addBudgetCategory, setAddBudgetCategory] = useState<string>("");
  const [addBudgetAmount, setAddBudgetAmount] = useState<string>("");
  const [addBudgetLoading, setAddBudgetLoading] = useState(false);

  // Which month the "Budget & Remaining" card is showing. Defaults to the
  // current month; the person can step back to review past months, but
  // never forward past the current month.
  const [budgetViewDate, setBudgetViewDate] = useState<Date>(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const now = new Date();
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const toLocalDateStr = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const firstDayOfMonth = toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  const todayDate = toLocalDateStr(now);

  const [summaryFromDate, setSummaryFromDate] = useState<string>(firstDayOfMonth);
  const [summaryToDate, setSummaryToDate] = useState<string>(todayDate);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");

  const [showAddModal, setShowAddModal] = useState(false);
  const [addItem, setAddItem] = useState<string>("");
  const [addCategory, setAddCategory] = useState<string>(CATEGORY_OPTIONS[0]);
  const [addAmount, setAddAmount] = useState<string>("");
  const [addType, setAddType] = useState<"income" | "expense">("expense");
  const [addLoading, setAddLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ tx: Transaction; timeoutId: ReturnType<typeof setTimeout> } | null>(null);

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [otpStep, setOtpStep] = useState<"form" | "verify">("form");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);

  // WhatsApp Notification helper function
  const sendWhatsAppNotification = async (message: string) => {
    try {
      await fetch('https://brofinai.com/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: userPhone || 'ADMIN_PHONE',
          message: message
        }),
      });
      console.log('WhatsApp notification sent successfully!');
    } catch (err) {
      console.error('Failed to sent WhatsApp notification:', err);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    setUserEmail(session.user.email || "");
    setUserId(session.user.id);

    // Fetch user profile & budget data from Supabase using upsert/maybeSingle safety to avoid 422/PGRST116 errors
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("email", session.user.email)
      .maybeSingle();

    let phoneToUse = userData?.phone_number?.trim() || "";

    if (userData?.id) setDbUserId(userData.id);

    if (userData) {
      setCurrency(userData.currency || "USD");
      if (userData.language) setAppLanguage(userData.language);
      
      const displayName = userData.nickname || userData.name || "Bro";
      setNickname(displayName);
      setProfileName(displayName);
      setUserPhone(phoneToUse);
      setProfilePhone(phoneToUse);
      if (userData.avatar_url) {
        setAvatarUrl(userData.avatar_url);
        setSelectedAvatar(userData.avatar_url);
      } else {
        setSelectedAvatar(AVATAR_OPTIONS[0]);
      }

      const plan = (userData.plan || "lite").toLowerCase();
      setSubscriptionPlan(plan);

      // Which channel this account is linked to — phone_number set means
      // WhatsApp, telegram_chat_id set means Telegram is linked. Shown as a
      // badge so it's clear at a glance which chat the bot replies come from.
      if (userData.telegram_chat_id) {
        setLinkedChannel("telegram");
      } else if (userData.phone_number) {
        setLinkedChannel("whatsapp");
      } else {
        setLinkedChannel(null);
      }
    }

    // 🎯 1. Fetch Budgets — filtered by user_id (channel-agnostic, and never
    // fetches every user's budgets when phone_number is empty).
    let budgetQuery = supabase.from("budgets").select("*");
    if (userData?.id) {
      budgetQuery = budgetQuery.eq("user_id", userData.id);
    } else {
      budgetQuery = budgetQuery.eq("id", "00000000-0000-0000-0000-000000000000"); // no user resolved yet — fetch nothing
    }
    const { data: budgetData } = await budgetQuery;

    if (budgetData && budgetData.length > 0) {
      const catMap: { [key: string]: number } = {};
      const idMap: { [key: string]: string } = {};
      let totalB = 0;
      budgetData.forEach((b: any) => {
        const amt = Number(b.amount_limit || 0);
        catMap[b.category] = amt;
        if (b.id) idMap[b.category] = b.id;
        totalB += amt;
      });

      setMonthlyBudget(totalB);
      setTempBudget(totalB.toString());
      setCategoryBudgets(catMap);
      setBudgetRowIds(idMap);
      
      const tempMap: { [key: string]: string } = {};
      Object.keys(catMap).forEach(k => {
        tempMap[k] = catMap[k].toString();
      });
      setTempCatBudgets(tempMap);
    } else if (userData?.monthly_budget) {
      setMonthlyBudget(Number(userData.monthly_budget));
      setTempBudget(userData.monthly_budget.toString());
      if (userData.category_budgets) {
        setCategoryBudgets(userData.category_budgets);
        const tempMap: { [key: string]: string } = {};
        Object.keys(userData.category_budgets).forEach(k => {
          tempMap[k] = userData.category_budgets[k].toString();
        });
        setTempCatBudgets(tempMap);
      }
    } else {
      console.log('No monthly budget found in database.');
      await sendWhatsAppNotification("⚠️ No budget found in your account! Please set your budget using WhatsApp.");
    }

    // Fetch transactions — filtered server-side by user_id (not
    // phone_number) so it's channel-agnostic: a single user_id covers both
    // WhatsApp- and Telegram-logged transactions after linking/upgrading.
    // Previously this fetched the ENTIRE table and filtered by phone_number
    // client-side, which (a) hid Telegram-only transactions entirely since
    // they have no phone_number, and (b) leaked every user's transactions
    // to the client whenever phoneToUse was empty (e.g. Telegram-only
    // accounts) since the "no phone" branch skipped filtering altogether.
    if (userData?.id) {
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false });

      setTransactions(txData ? [...txData] : []);
    } else {
      setTransactions([]);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const timer = setTimeout(() => setOtpResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpResendCooldown]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleManageSubscription = async () => {
  setPortalLoading(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("Please log in again.");
      return;
    }

    const res = await fetch("/api/portal-link", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    const data = await res.json();
    if (data?.url) {
      window.open(data.url, "_blank");
    } else {
      alert(data?.error || "No active subscription found.");
    }
  } catch (err) {
    console.error("Portal link error:", err);
    alert("Something went wrong. Please try again.");
  } finally {
    setPortalLoading(false);
  }
};

  const handleSaveBudget = async () => {
    const val = Number(tempBudget);
    if (isNaN(val) || val < 0) return;

    const newCatBudgetsMap: { [key: string]: number } = {};
    const newBudgetRowIds: { [key: string]: string } = {};
    const dbUpdates: PromiseLike<any>[] = [];

    Object.keys(tempCatBudgets).forEach(origCat => {
      const newCat = (tempCatNames[origCat] || origCat).trim();
      const amt = Number(tempCatBudgets[origCat]) || 0;
      newCatBudgetsMap[newCat] = amt;

      const rowId = budgetRowIds[origCat];
      if (rowId) {
        newBudgetRowIds[newCat] = rowId;
        // Persist both the (possibly renamed) category and the new amount to
        // the same "budgets" row the bot writes to.
        dbUpdates.push(
          supabase.from("budgets").update({ category: newCat, amount_limit: amt }).eq("id", rowId)
        );
      }
    });

    const newTempCatBudgets: { [key: string]: string } = {};
    Object.keys(newCatBudgetsMap).forEach(k => {
      newTempCatBudgets[k] = newCatBudgetsMap[k].toString();
    });

    setMonthlyBudget(val);
    setCategoryBudgets(newCatBudgetsMap);
    setTempCatBudgets(newTempCatBudgets);
    setBudgetRowIds(newBudgetRowIds);
    setTempCatNames({});
    setIsEditingBudget(false);

    try {
      await Promise.all(dbUpdates);
      await supabase
        .from("users")
        .update({ 
          monthly_budget: val,
          category_budgets: newCatBudgetsMap
        })
        .eq("email", userEmail);
    } catch (err) {
      console.error("Error saving budget:", err);
    }
  };

  const handleCancelEditBudget = () => {
    // Revert any in-progress category renames / amount edits back to what's
    // currently saved, without touching Supabase.
    const tempMap: { [key: string]: string } = {};
    Object.keys(categoryBudgets).forEach(k => {
      tempMap[k] = categoryBudgets[k].toString();
    });
    setTempCatBudgets(tempMap);
    setTempBudget(monthlyBudget.toString());
    setTempCatNames({});
    setIsEditingBudget(false);
  };

  // Month navigation for the Budget & Remaining card. Budgets themselves are
  // fixed per category (there's no historical "this was the target back in
  // June" record), but the spend figures shown against them can be reviewed
  // for any past month. Stepping forward is capped at the current month.
  const isBudgetViewCurrentMonth = useMemo(() => {
    const n = new Date();
    return budgetViewDate.getFullYear() === n.getFullYear() && budgetViewDate.getMonth() === n.getMonth();
  }, [budgetViewDate]);

  const handleBudgetPrevMonth = () => {
    setBudgetViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleBudgetNextMonth = () => {
    if (isBudgetViewCurrentMonth) return;
    setBudgetViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Removes a category's budget entirely — deletes the Supabase row (matched
  // by its id when known, falling back to user_id + category) and updates
  // local totals so the overall monthly budget stays in sync.
  const handleDeleteBudgetCategory = async (cat: string) => {
    if (!window.confirm(`Remove the budget for "${cat}"? This can't be undone.`)) return;

    const amt = categoryBudgets[cat] || 0;
    const rowId = budgetRowIds[cat];
    setDeletingBudgetCat(cat);

    try {
      if (rowId) {
        await supabase.from("budgets").delete().eq("id", rowId);
      } else if (dbUserId) {
        await supabase.from("budgets").delete().eq("user_id", dbUserId).eq("category", cat);
      }

      setCategoryBudgets(prev => {
        const next = { ...prev };
        delete next[cat];
        return next;
      });
      setTempCatBudgets(prev => {
        const next = { ...prev };
        delete next[cat];
        return next;
      });
      setBudgetRowIds(prev => {
        const next = { ...prev };
        delete next[cat];
        return next;
      });
      setTempCatNames(prev => {
        const next = { ...prev };
        delete next[cat];
        return next;
      });
      setMonthlyBudget(prev => Math.max(0, prev - amt));
      setTempBudget(prev => Math.max(0, Number(prev) - amt).toString());

      try {
        await supabase
          .from("users")
          .update({ monthly_budget: Math.max(0, monthlyBudget - amt) })
          .eq("email", userEmail);
      } catch { /* non-critical fallback sync */ }
    } catch (err) {
      console.error("Error deleting budget category:", err);
      alert("Failed to remove that budget. Please try again.");
    } finally {
      setDeletingBudgetCat(null);
    }
  };

  // Categories that don't have a budget row yet — only these can be added.
  const availableBudgetCategories = useMemo(
    () => CATEGORY_OPTIONS.filter(c => !(c in categoryBudgets)),
    [categoryBudgets]
  );

  const handleOpenAddBudgetModal = () => {
    setAddBudgetCategory(availableBudgetCategories[0] || "");
    setAddBudgetAmount("");
    setShowAddBudgetModal(true);
  };

  const handleCloseAddBudgetModal = () => {
    setShowAddBudgetModal(false);
  };

  // Inserts into the "budgets" table — the same table the WhatsApp/Telegram
  // bot's set_budget action writes to (see saveExtractedDirect /
  // handleConfirmTransaction in finance-logic.ts), so a budget added here
  // shows up the same way a budget set via chat would.
  const handleAddBudget = async () => {
    const amt = Number(addBudgetAmount);
    if (!addBudgetCategory || !addBudgetAmount || isNaN(amt) || amt <= 0) {
      alert("Please choose a category and enter a valid limit.");
      return;
    }

    setAddBudgetLoading(true);

    try {
      const { error, data: insertedRows } = await supabase
        .from("budgets")
        .insert([{
          user_id: dbUserId,
          category: addBudgetCategory,
          amount_limit: amt,
        }])
        .select();

      if (error) throw error;
      if (!insertedRows || insertedRows.length === 0) {
        throw new Error("Budget could not be saved.");
      }

      setCategoryBudgets(prev => ({ ...prev, [addBudgetCategory]: amt }));
      setTempCatBudgets(prev => ({ ...prev, [addBudgetCategory]: amt.toString() }));
      if (insertedRows[0]?.id) {
        setBudgetRowIds(prev => ({ ...prev, [addBudgetCategory]: insertedRows[0].id }));
      }
      setMonthlyBudget(prev => prev + amt);
      setTempBudget(prev => (Number(prev) + amt).toString());
      setShowAddBudgetModal(false);
    } catch (err: any) {
      console.error("Error adding budget:", err);
      alert("Failed to add budget: " + err.message);
    } finally {
      setAddBudgetLoading(false);
    }
  };

  const handleStartEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditItem(tx.item || "");
    setEditCategory(tx.category || "Other");
    setEditAmount(tx.amount.toString());
    setEditType(tx.type || "expense");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleOpenAddModal = () => {
    setAddItem("");
    setAddCategory(CATEGORY_OPTIONS[0]);
    setAddAmount("");
    setAddType("expense");
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleAddTransaction = async () => {
    if (!addItem.trim() || !addAmount || isNaN(Number(addAmount)) || Number(addAmount) <= 0) {
      alert("Please enter a valid description and amount.");
      return;
    }

    setAddLoading(true);

    try {
      const { error, data: insertedRows } = await supabase
        .from("transactions")
        .insert([{
          user_id: dbUserId,
          item: addItem.trim(),
          category: addCategory,
          amount: Number(addAmount),
          type: addType,
          currency,
        }])
        .select();

      if (error) throw error;
      if (!insertedRows || insertedRows.length === 0) {
        throw new Error("Transaction could not be saved.");
      }

      setTransactions(prev =>
        [...prev, insertedRows[0]].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
      setShowAddModal(false);
    } catch (err: any) {
      console.error("Error adding transaction:", err);
      alert("Failed to add transaction: " + err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editItem.trim() || !editAmount || isNaN(Number(editAmount))) {
      alert("Please enter a valid description and amount.");
      return;
    }

    setSaveLoading(true);

    try {
      const { error, data: updatedRows } = await supabase
        .from("transactions")
        .update({
          item: editItem.trim(),
          category: editCategory,
          amount: Number(editAmount),
          type: editType
        })
        .eq("id", id)
        .eq("user_id", dbUserId) // ownership check — only rows belonging to this user can be edited
        .select();

      if (error) throw error;
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("Transaction not found or you don't have permission to edit it.");
      }

      setTransactions(prev => prev.map(t => t.id === id ? {
        ...t,
        item: editItem.trim(),
        category: editCategory,
        amount: Number(editAmount),
        type: editType
      } : t));

      setEditingId(null);
    } catch (err: any) {
      console.error("Error updating transaction:", err);
      alert("Failed to save transaction: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Actually deletes a transaction from Supabase. Called once the undo window expires
  // (or immediately if another delete comes in before the previous one's window ends).
  const commitDelete = async (tx: Transaction) => {
    try {
      const { error, data: deletedRows } = await supabase
        .from("transactions")
        .delete()
        .eq("id", tx.id)
        .eq("user_id", dbUserId) // ownership check — only rows belonging to this user can be deleted
        .select();

      if (error) throw error;
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error("Transaction not found or you don't have permission to delete it.");
      }
    } catch (err: any) {
      console.error("Error deleting transaction:", err);
      // Put it back since the server-side delete didn't actually happen.
      setTransactions(prev => {
        if (prev.some(t => t.id === tx.id)) return prev;
        return [...prev, tx].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      alert("Failed to delete transaction: " + err.message);
    }
  };

  // Removes the row from view right away and starts a 6s undo window.
  // The real delete only happens once that window passes without an Undo click.
  const handleDeleteTransaction = (tx: Transaction) => {
    if (pendingDelete) {
      clearTimeout(pendingDelete.timeoutId);
      commitDelete(pendingDelete.tx);
    }

    setTransactions(prev => prev.filter(t => t.id !== tx.id));
    if (editingId === tx.id) setEditingId(null);

    const timeoutId = setTimeout(() => {
      commitDelete(tx);
      setPendingDelete(current => (current?.tx.id === tx.id ? null : current));
    }, 6000);

    setPendingDelete({ tx, timeoutId });
  };

  const handleUndoDelete = () => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timeoutId);
    setTransactions(prev =>
      [...prev, pendingDelete.tx].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    );
    setPendingDelete(null);
  };

  const handleCustomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileMsg({ type: "error", text: "Please select an image smaller than 2MB." });
      return;
    }

    setUploadingImg(true);
    setProfileMsg(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setSelectedAvatar(reader.result);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          setSelectedAvatar(publicUrlData.publicUrl);
        }
      }
    } catch (err: any) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelectedAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImg(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    try {
      const { error } = await supabase
        .from("users")
        .update({ 
          nickname: profileName,
          phone_number: profilePhone,
          currency: currency,
          language: appLanguage,
          avatar_url: selectedAvatar
        })
        .eq("email", userEmail);

      if (error) throw error;

      setNickname(profileName);
      setUserPhone(profilePhone);
      setAvatarUrl(selectedAvatar);
      setProfileMsg({ type: "success", text: "Profile & regional details updated successfully!" });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setProfileLoading(false);
    }
  };

  // Step 1: validate the new password, then email a one-time code to the account's address
  const handleRequestPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    if (!userEmail) {
      setPasswordMsg({ type: "error", text: "No account email found. Please re-login and try again." });
      return;
    }

    setPasswordLoading(true);

    try {
      // Sends a 6-digit OTP code to the user's registered email via our own
      // Nodemailer/Namecheap route (same one used by the login page's
      // Forgot Password flow), instead of Supabase's built-in auth email.
      const res = await fetch("/api/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to send verification code.");

      setOtpStep("verify");
      setOtpCode("");
      setOtpResendCooldown(30);
      setPasswordMsg({ type: "success", text: `We've emailed a verification code to ${userEmail}.` });
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to send verification code." });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Step 2: verify the emailed OTP, then apply the new password
  const handleVerifyOtpAndChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!otpCode || otpCode.trim().length < 6) {
      setPasswordMsg({ type: "error", text: "Please enter the 6-digit code sent to your email." });
      return;
    }

    setOtpLoading(true);

    try {
      const res = await fetch("/api/verify-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          otp: otpCode.trim(),
          newPassword: newPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Invalid or expired code.");

      setPasswordMsg({ type: "success", text: "Password updated successfully!" });
      setNewPassword("");
      setConfirmPassword("");
      setOtpCode("");
      setOtpStep("form");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Invalid or expired code. Please try again." });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpResendCooldown > 0 || !userEmail) return;
    setPasswordMsg(null);
    setOtpLoading(true);
    try {
      const res = await fetch("/api/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to resend code.");

      setOtpResendCooldown(30);
      setPasswordMsg({ type: "success", text: "A new code has been sent to your email." });
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to resend code." });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCancelOtp = () => {
    setOtpStep("form");
    setOtpCode("");
    setPasswordMsg(null);
  };

  const rangeFilteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.created_at) return false;
      const txDate = new Date(t.created_at);
      txDate.setHours(0, 0, 0, 0);

      let matchesFrom = true;
      let matchesTo = true;

      if (summaryFromDate) {
        const from = new Date(summaryFromDate);
        from.setHours(0, 0, 0, 0);
        if (txDate < from) matchesFrom = false;
      }

      if (summaryToDate) {
        const to = new Date(summaryToDate);
        to.setHours(23, 59, 59, 999);
        if (txDate > to) matchesTo = false;
      }

      return matchesFrom && matchesTo;
    });
  }, [transactions, summaryFromDate, summaryToDate]);

  const totalIncome = useMemo(() => 
    rangeFilteredTransactions.filter(t => t.type === "income").reduce((acc, t) => acc + Number(t.amount || 0), 0),
  [rangeFilteredTransactions]);

  const totalExpense = useMemo(() => 
    rangeFilteredTransactions.filter(t => t.type === "expense").reduce((acc, t) => acc + Number(t.amount || 0), 0),
  [rangeFilteredTransactions]);

  const accountBalance = totalIncome - totalExpense;

  // Independent of the "From date / To date" summary filter above — tracks
  // whichever month is selected via budgetViewDate (defaults to the current
  // calendar month), so "Overall Monthly Budget" stays accurate even when
  // the person is viewing a different range elsewhere on the page.
  const currentMonthExpense = useMemo(() => {
    const start = new Date(budgetViewDate.getFullYear(), budgetViewDate.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(budgetViewDate.getFullYear(), budgetViewDate.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    return transactions
      .filter(t => t.type === "expense" && t.created_at)
      .filter(t => {
        const txDate = new Date(t.created_at);
        return txDate >= start && txDate <= end;
      })
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions, budgetViewDate]);

  // Per-category spend for the selected month — kept in step with
  // currentMonthExpense above so every number in the Budget & Remaining
  // card reflects the same month, regardless of the dashboard's date filter.
  const categoryMonthExpenses = useMemo(() => {
    const start = new Date(budgetViewDate.getFullYear(), budgetViewDate.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(budgetViewDate.getFullYear(), budgetViewDate.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    const map: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === "expense" && t.created_at)
      .filter(t => {
        const txDate = new Date(t.created_at);
        return txDate >= start && txDate <= end;
      })
      .forEach(t => {
        const cat = t.category || "Other";
        map[cat] = (map[cat] || 0) + Number(t.amount || 0);
      });
    return map;
  }, [transactions, budgetViewDate]);

  const categoryExpenses = useMemo(() => {
    const map: { [key: string]: number } = {};
    rangeFilteredTransactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        const cat = t.category || "Other";
        map[cat] = (map[cat] || 0) + Number(t.amount || 0);
      });
    return map;
  }, [rangeFilteredTransactions]);

  const pieChartData = useMemo(() => {
    return Object.keys(categoryExpenses).map(cat => ({ name: cat, value: categoryExpenses[cat] }));
  }, [categoryExpenses]);

  const budgetChartData = useMemo(() => {
    return [
      { name: "Monthly Target", amount: monthlyBudget },
      { name: "Total Spent", amount: totalExpense }
    ];
  }, [monthlyBudget, totalExpense]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = (t.item?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
                            (t.category?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === "all" || t.type === selectedType;

      let matchesDate = true;
      if (t.created_at) {
        const txDate = new Date(t.created_at);
        txDate.setHours(0, 0, 0, 0);

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (txDate < start) matchesDate = false;
        }

        if (endDate && matchesDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (txDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [transactions, searchTerm, selectedType, startDate, endDate]);

  const handleExportExcel = async () => {
    if (subscriptionPlan === "lite") {
      alert("Excel export is available for Core & Max users only. Please upgrade!");
      return;
    }

    if (transactions.length === 0) return;

    // ---------- palette ----------
    const INCOME_HEADER = "FF1E8449";
    const INCOME_FILL = "FFD5F5E3";
    const EXPENSE_HEADER = "FFC0392B";
    const EXPENSE_FILL = "FFFADBD8";
    const BUDGET_HEADER = "FF1F618D";
    const BUDGET_FILL = "FFD6EAF8";
    const TITLE_FILL = "FF2C3E50";
    const SUMMARY_FILL = "FFECF0F1";
    const WHITE = "FFFFFFFF";
    const FONT_NAME = "Arial";
    const CURRENCY_FMT = `"${currency} "#,##0.00`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Smart Finance Dashboard";
    workbook.created = new Date();

    const thinBorder = { style: "thin" as const, color: { argb: "FFB0B0B0" } };
    const cellBorder = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };

    const styleTitle = (ws: ExcelJS.Worksheet, row: number, mergeRange: string, text: string, fillArgb: string) => {
      ws.mergeCells(mergeRange);
      const cell = ws.getCell(`A${row}`);
      cell.value = text;
      cell.font = { name: FONT_NAME, size: 13, bold: true, color: { argb: WHITE } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillArgb } };
      cell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
      ws.getRow(row).height = 22;
    };

    const styleHeaderRow = (ws: ExcelJS.Worksheet, row: number, colCount: number, fillArgb: string) => {
      for (let c = 1; c <= colCount; c++) {
        const cell = ws.getRow(row).getCell(c);
        cell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: WHITE } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillArgb } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = cellBorder;
      }
    };

    const styleDataRow = (ws: ExcelJS.Worksheet, row: number, colCount: number, fillArgb: string, amountCol: number) => {
      for (let c = 1; c <= colCount; c++) {
        const cell = ws.getRow(row).getCell(c);
        cell.font = { name: FONT_NAME, size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillArgb } };
        cell.border = cellBorder;
        cell.alignment = { horizontal: c === amountCol ? "right" : c === 1 ? "center" : "left", vertical: "middle" };
        if (c === amountCol) cell.numFmt = CURRENCY_FMT;
      }
    };

    const styleTotalRow = (ws: ExcelJS.Worksheet, row: number, colCount: number, fillArgb: string, amountCols: number[]) => {
      for (let c = 1; c <= colCount; c++) {
        const cell = ws.getRow(row).getCell(c);
        cell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: WHITE } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillArgb } };
        cell.border = cellBorder;
        cell.alignment = { horizontal: amountCols.includes(c) ? "right" : "left", vertical: "middle" };
        if (amountCols.includes(c)) cell.numFmt = CURRENCY_FMT;
      }
    };

    const writeIncomeExpenseTable = (
      ws: ExcelJS.Worksheet,
      startRow: number,
      title: string,
      headerLabel: string,
      headerFill: string,
      rowFill: string,
      list: Transaction[],
      totalLabel: string
    ) => {
      styleTitle(ws, startRow, `A${startRow}:D${startRow}`, title, headerFill);
      const headerRow = startRow + 1;
      ["Date", headerLabel, "Category", "Amount"].forEach((h, i) => {
        ws.getRow(headerRow).getCell(i + 1).value = h;
      });
      styleHeaderRow(ws, headerRow, 4, headerFill);

      const firstDataRow = headerRow + 1;
      list.forEach((t, i) => {
        const r = firstDataRow + i;
        ws.getRow(r).getCell(1).value = t.created_at ? new Date(t.created_at).toLocaleDateString() : "";
        ws.getRow(r).getCell(2).value = t.item || "";
        ws.getRow(r).getCell(3).value = t.category || "General";
        ws.getRow(r).getCell(4).value = Number(t.amount || 0);
        styleDataRow(ws, r, 4, rowFill, 4);
      });
      // two blank editable rows for manual additions
      for (let i = 0; i < 2; i++) {
        const r = firstDataRow + list.length + i;
        styleDataRow(ws, r, 4, rowFill, 4);
      }
      const lastDataRow = firstDataRow + list.length + 1;
      const totalRow = lastDataRow + 1;
      const total = list.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      ws.getRow(totalRow).getCell(3).value = totalLabel;
      // Cache the computed result alongside the formula: viewers that
      // recalculate (desktop Excel) still respect any rows the user adds
      // manually to the two blank rows above, while viewers that don't
      // recalculate (mobile/WPS/quick-preview) still show the right number
      // immediately instead of a blank cell.
      ws.getRow(totalRow).getCell(4).value = { formula: `SUM(D${firstDataRow}:D${lastDataRow})`, result: total };
      styleTotalRow(ws, totalRow, 4, headerFill, [4]);

      return { headerRow, firstDataRow, lastDataRow, totalRow, nextRow: totalRow + 2, total };
    };

    // =====================================================================
    // SHEET 1: This Month — Income, Expenses, Budget Handling (+ Month Picker)
    // =====================================================================
    const now = new Date();
    const monthLabel = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const thisMonthTx = transactions.filter(t => {
      if (!t.created_at) return false;
      const d = new Date(t.created_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const monthIncomeList = thisMonthTx.filter(t => t.type === "income");
    const monthExpenseList = thisMonthTx.filter(t => t.type === "expense");

    // "MMM YYYY" key (e.g. "Aug 2026") used both as the dropdown's option
    // text and as the value stamped on every hidden row on All Records, so
    // SUMIFS can match a transaction to whichever month is picked.
    const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthKeyOf = (d: Date) => `${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`;
    const currentMonthKey = monthKeyOf(now);
    // Last 12 months, most recent (current) first — matches the dropdown order.
    const monthPickerOptions = Array.from({ length: 12 }, (_, i) =>
      monthKeyOf(new Date(now.getFullYear(), now.getMonth() - i, 1))
    );

    // No separate "Raw Data" sheet. Instead, the full transaction history
    // (+ MonthKey per row) that powers the month picker's SUMIFS formulas
    // is tucked into hidden columns H:M of the "All Records" sheet further
    // below (see RAW_* constants), so it doesn't clutter the workbook with
    // an extra tab while the picker still works.
    const rawDataLastRow = Math.max(2, transactions.length + 1);
    const RAW_SHEET = "All Records";
    const RAW_COL_DATE = "H";
    const RAW_COL_ITEM = "I";
    const RAW_COL_CATEGORY = "J";
    const RAW_COL_TYPE = "K";
    const RAW_COL_AMOUNT = "L";
    const RAW_COL_MONTHKEY = "M";
    const RAW_COL_OPTIONS = "O";

    const ws1 = workbook.addWorksheet("This Month", { views: [{ showGridLines: false }] });
    ws1.columns = [{ width: 14 }, { width: 26 }, { width: 18 }, { width: 16 }];

    ws1.mergeCells("A1:D1");
    ws1.getCell("A1").value = `MONTHLY BUDGET TRACKER — ${monthLabel}`;
    ws1.getCell("A1").font = { name: FONT_NAME, size: 16, bold: true, color: { argb: WHITE } };
    ws1.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: TITLE_FILL } };
    ws1.getCell("A1").alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    ws1.getRow(1).height = 30;

    const incomeResult = writeIncomeExpenseTable(ws1, 3, "INCOME", "Source", INCOME_HEADER, INCOME_FILL, monthIncomeList, "TOTAL INCOME");
    const expenseResult = writeIncomeExpenseTable(ws1, incomeResult.nextRow, "EXPENSES", "Item", EXPENSE_HEADER, EXPENSE_FILL, monthExpenseList, "TOTAL EXPENSES");

    // ---- Month Picker ----
    const pickerRow = expenseResult.nextRow;
    ws1.mergeCells(`A${pickerRow}:B${pickerRow}`);
    ws1.getRow(pickerRow).getCell(1).value = "📅 Viewing Month:";
    ws1.getRow(pickerRow).getCell(1).font = { name: FONT_NAME, size: 10, bold: true };
    ws1.getRow(pickerRow).getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    const monthPickerCellRef = `C${pickerRow}`;
    const pickerCell = ws1.getCell(monthPickerCellRef);
    pickerCell.value = currentMonthKey;
    pickerCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: WHITE } };
    pickerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TITLE_FILL } };
    pickerCell.alignment = { horizontal: "center", vertical: "middle" };
    pickerCell.border = cellBorder;
    pickerCell.dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`'${RAW_SHEET}'!$${RAW_COL_OPTIONS}$2:$${RAW_COL_OPTIONS}$${1 + monthPickerOptions.length}`],
      showErrorMessage: true,
      errorTitle: "Invalid month",
      error: "Please pick a month from the dropdown.",
    };
    const pickerNoteRow = pickerRow + 1;
    ws1.mergeCells(`A${pickerNoteRow}:D${pickerNoteRow}`);
    ws1.getRow(pickerNoteRow).getCell(1).value =
      "Change the month above — Budget Handling & Summary below recalculate automatically (desktop Excel/Sheets). Income/Expenses tables above stay fixed to the export month.";
    ws1.getRow(pickerNoteRow).getCell(1).font = { name: FONT_NAME, size: 8, italic: true, color: { argb: "FF888888" } };
    ws1.getRow(pickerNoteRow).getCell(1).alignment = { horizontal: "left", vertical: "middle", wrapText: true };

    // ---- Budget Handling table ----
    const budgetTitleRow = pickerNoteRow + 1;
    styleTitle(ws1, budgetTitleRow, `A${budgetTitleRow}:D${budgetTitleRow}`, "BUDGET HANDLING", BUDGET_HEADER);
    const budgetHeaderRow = budgetTitleRow + 1;
    ["Category", "Budgeted", "Actual Spent", "Remaining"].forEach((h, i) => {
      ws1.getRow(budgetHeaderRow).getCell(i + 1).value = h;
    });
    styleHeaderRow(ws1, budgetHeaderRow, 4, BUDGET_HEADER);

    const budgetCategories = Object.keys(categoryBudgets).length > 0 ? Object.keys(categoryBudgets) : CATEGORY_OPTIONS;
    const budgetFirstRow = budgetHeaderRow + 1;
    // "Actual Spent" / "Remaining" are SUMIFS formulas against the hidden data so
    // they respond to the month picker above. Each also carries a cached
    // `result` (computed here in JS for the current month, matching the
    // picker's default) so the sheet still shows correct numbers the
    // instant it's opened, even in viewers that don't recalculate —
    // switching the picker itself still needs a real recalculating app.
    let budgetTotalBudgeted = 0;
    let budgetTotalSpentNow = 0;
    budgetCategories.forEach((cat, i) => {
      const r = budgetFirstRow + i;
      const budgeted = Number(categoryBudgets[cat] || 0);
      const spentNow = monthExpenseList
        .filter(t => t.category === cat)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      budgetTotalBudgeted += budgeted;
      budgetTotalSpentNow += spentNow;

      ws1.getRow(r).getCell(1).value = cat;
      ws1.getRow(r).getCell(2).value = budgeted;
      ws1.getRow(r).getCell(3).value = {
        formula: `SUMIFS('${RAW_SHEET}'!$${RAW_COL_AMOUNT}$2:$${RAW_COL_AMOUNT}$${rawDataLastRow},'${RAW_SHEET}'!$${RAW_COL_TYPE}$2:$${RAW_COL_TYPE}$${rawDataLastRow},"expense",'${RAW_SHEET}'!$${RAW_COL_CATEGORY}$2:$${RAW_COL_CATEGORY}$${rawDataLastRow},A${r},'${RAW_SHEET}'!$${RAW_COL_MONTHKEY}$2:$${RAW_COL_MONTHKEY}$${rawDataLastRow},$C$${pickerRow})`,
        result: spentNow,
      };
      ws1.getRow(r).getCell(4).value = { formula: `B${r}-C${r}`, result: budgeted - spentNow };
      styleDataRow(ws1, r, 4, BUDGET_FILL, 2);
      styleDataRow(ws1, r, 4, BUDGET_FILL, 3);
      styleDataRow(ws1, r, 4, BUDGET_FILL, 4);
      ws1.getRow(r).getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    });
    const budgetLastRow = budgetFirstRow + budgetCategories.length - 1;
    const budgetTotalRow = budgetLastRow + 1;
    ws1.getRow(budgetTotalRow).getCell(1).value = "TOTAL";
    ws1.getRow(budgetTotalRow).getCell(2).value = budgetTotalBudgeted;
    ws1.getRow(budgetTotalRow).getCell(3).value = {
      formula: `SUM(C${budgetFirstRow}:C${budgetLastRow})`,
      result: budgetTotalSpentNow,
    };
    ws1.getRow(budgetTotalRow).getCell(4).value = {
      formula: `SUM(D${budgetFirstRow}:D${budgetLastRow})`,
      result: budgetTotalBudgeted - budgetTotalSpentNow,
    };
    styleTotalRow(ws1, budgetTotalRow, 4, BUDGET_HEADER, [2, 3, 4]);

    // ---- Summary box ----
    const summaryTitleRow = budgetTotalRow + 2;
    styleTitle(ws1, summaryTitleRow, `A${summaryTitleRow}:D${summaryTitleRow}`, "SUMMARY", TITLE_FILL);
    const summaryIncomeRow = summaryTitleRow + 1;
    const summaryExpenseRow = summaryTitleRow + 2;
    const summaryNetRow = summaryTitleRow + 3;
    const summaryEntries: { row: number; label: string; value: { formula: string; result: number } }[] = [
      {
        row: summaryIncomeRow,
        label: "Total Income",
        value: {
          formula: `SUMIFS('${RAW_SHEET}'!$${RAW_COL_AMOUNT}$2:$${RAW_COL_AMOUNT}$${rawDataLastRow},'${RAW_SHEET}'!$${RAW_COL_TYPE}$2:$${RAW_COL_TYPE}$${rawDataLastRow},"income",'${RAW_SHEET}'!$${RAW_COL_MONTHKEY}$2:$${RAW_COL_MONTHKEY}$${rawDataLastRow},$C$${pickerRow})`,
          result: incomeResult.total,
        },
      },
      {
        row: summaryExpenseRow,
        label: "Total Expenses",
        value: {
          formula: `SUMIFS('${RAW_SHEET}'!$${RAW_COL_AMOUNT}$2:$${RAW_COL_AMOUNT}$${rawDataLastRow},'${RAW_SHEET}'!$${RAW_COL_TYPE}$2:$${RAW_COL_TYPE}$${rawDataLastRow},"expense",'${RAW_SHEET}'!$${RAW_COL_MONTHKEY}$2:$${RAW_COL_MONTHKEY}$${rawDataLastRow},$C$${pickerRow})`,
          result: expenseResult.total,
        },
      },
      {
        row: summaryNetRow,
        label: "Net Balance",
        value: {
          formula: `B${summaryIncomeRow}-B${summaryExpenseRow}`,
          result: incomeResult.total - expenseResult.total,
        },
      },
    ];
    summaryEntries.forEach(({ row: r, label, value }) => {
      ws1.mergeCells(`B${r}:D${r}`);
      ws1.getRow(r).getCell(1).value = label;
      ws1.getRow(r).getCell(2).value = value;
      [1, 2].forEach(c => {
        const cell = ws1.getRow(r).getCell(c);
        cell.font = { name: FONT_NAME, size: 10, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY_FILL } };
        cell.border = cellBorder;
        cell.alignment = { horizontal: c === 2 ? "right" : "left", vertical: "middle" };
        if (c === 2) cell.numFmt = CURRENCY_FMT;
      });
    });

    // =====================================================================
    // SHEET 2: All Records — All Income, All Expenses
    // =====================================================================
    const allIncomeList = transactions.filter(t => t.type === "income");
    const allExpenseList = transactions.filter(t => t.type === "expense");

    const ws2 = workbook.addWorksheet("All Records", { views: [{ showGridLines: false }] });
    ws2.columns = [{ width: 14 }, { width: 26 }, { width: 18 }, { width: 16 }];

    ws2.mergeCells("A1:D1");
    ws2.getCell("A1").value = "ALL RECORDS — Full History";
    ws2.getCell("A1").font = { name: FONT_NAME, size: 16, bold: true, color: { argb: WHITE } };
    ws2.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: TITLE_FILL } };
    ws2.getCell("A1").alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    ws2.getRow(1).height = 30;

    const allIncomeResult = writeIncomeExpenseTable(ws2, 3, "ALL INCOME", "Source", INCOME_HEADER, INCOME_FILL, allIncomeList, "TOTAL");
    writeIncomeExpenseTable(ws2, allIncomeResult.nextRow, "ALL EXPENSES", "Item", EXPENSE_HEADER, EXPENSE_FILL, allExpenseList, "TOTAL");

    // ---- Hidden data (columns H:O) — powers the "This Month" month picker ----
    // Full, unfiltered transaction history plus a plain-text MonthKey per
    // row (not a formula — so it's correct even in viewers that don't
    // recalculate), tucked into hidden columns on this sheet instead of a
    // separate "Raw Data" tab. Budget Handling & Summary on "This Month"
    // run SUMIFS against these columns, filtered by whichever month is
    // selected in the picker cell.
    ws2.getCell(`${RAW_COL_DATE}1`).value = "Date";
    ws2.getCell(`${RAW_COL_ITEM}1`).value = "Item/Source";
    ws2.getCell(`${RAW_COL_CATEGORY}1`).value = "Category";
    ws2.getCell(`${RAW_COL_TYPE}1`).value = "Type";
    ws2.getCell(`${RAW_COL_AMOUNT}1`).value = "Amount";
    ws2.getCell(`${RAW_COL_MONTHKEY}1`).value = "MonthKey";
    transactions.forEach((t, i) => {
      const r = i + 2;
      const d = t.created_at ? new Date(t.created_at) : null;
      ws2.getCell(`${RAW_COL_DATE}${r}`).value = d ? d.toLocaleDateString() : "";
      ws2.getCell(`${RAW_COL_ITEM}${r}`).value = t.item || "";
      ws2.getCell(`${RAW_COL_CATEGORY}${r}`).value = t.category || "General";
      ws2.getCell(`${RAW_COL_TYPE}${r}`).value = t.type || "expense";
      ws2.getCell(`${RAW_COL_AMOUNT}${r}`).value = Number(t.amount || 0);
      ws2.getCell(`${RAW_COL_MONTHKEY}${r}`).value = d ? monthKeyOf(d) : "";
    });
    // Picker's dropdown source list.
    monthPickerOptions.forEach((m, i) => {
      ws2.getCell(`${RAW_COL_OPTIONS}${i + 2}`).value = m;
    });
    // Keep columns H:O out of sight — they're formula plumbing, not a
    // sheet meant to be browsed.
    ["H", "I", "J", "K", "L", "M", "N", "O"].forEach(col => {
      ws2.getColumn(col).hidden = true;
    });

    // ---------- download ----------
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Broo_Financial_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 sm:p-6 md:p-10 relative overflow-hidden selection:bg-emerald-500 selection:text-slate-950">
      {/* Background layer — pinned at z-0, strictly below the "relative z-10"
          content wrapper further down. FallingIcons' own div used -z-10
          directly under this outer div, which put it BEHIND this div's own
          background-color paint and made it invisible; wrapping it (and the
          glow blobs) at z-0 with an explicit z-10 content wrapper guarantees
          they render above the page background but below every section. */}
      <div className="fixed inset-0 -z-0 pointer-events-none">
        <FallingIcons />
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[180px]" />
        <div className="absolute top-[30%] right-[-10%] w-[650px] h-[650px] bg-emerald-500/15 rounded-full blur-[200px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[180px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-white/10 p-6 md:p-8 rounded-[36px] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0 group">
              {/* Gradient ring wrapper — plan-aware color, subtle glow behind the photo */}
              <div className={`absolute inset-0 rounded-[20px] blur-md opacity-60 transition-opacity group-hover:opacity-90 ${
                subscriptionPlan === "max"
                  ? "bg-gradient-to-br from-purple-500 to-indigo-500"
                  : subscriptionPlan === "core"
                  ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                  : "bg-gradient-to-br from-amber-400 to-yellow-500"
              }`} />
              <div className={`relative p-[2.5px] rounded-[20px] bg-gradient-to-br ${
                subscriptionPlan === "max"
                  ? "from-purple-400 to-indigo-500"
                  : subscriptionPlan === "core"
                  ? "from-emerald-400 to-teal-400"
                  : "from-amber-400 to-yellow-400"
              }`}>
                <img
                  src={avatarUrl}
                  alt="Profile Avatar"
                  className="w-16 h-16 rounded-[17.5px] object-cover bg-slate-950 shadow-lg"
                />
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-slate-950 p-1.5 rounded-full border-4 border-slate-900 shadow-md">
                <Zap size={9} className="fill-slate-950" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`text-[11px] font-extrabold px-3 py-0.5 rounded-full border flex items-center gap-1.5 uppercase backdrop-blur-md shadow-sm ${
                  subscriptionPlan === "max" 
                    ? "bg-purple-500/20 border-purple-400/40 text-purple-300"
                    : subscriptionPlan === "core"
                    ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                    : "bg-amber-500/20 border-amber-400/40 text-amber-300"
                }`}>
                  <Sparkles size={11} /> {subscriptionPlan.toUpperCase()} PACKAGE
                </span>
                {linkedChannel && (
                  <span className={`text-[11px] font-extrabold px-3 py-0.5 rounded-full border flex items-center gap-1.5 uppercase backdrop-blur-md shadow-sm ${
                    linkedChannel === "telegram"
                      ? "bg-sky-500/20 border-sky-400/40 text-sky-300"
                      : "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                  }`}>
                    {linkedChannel === "telegram" ? "Telegram" : "WhatsApp"}
                  </span>
                )}
                <span className="text-[11px] font-extrabold px-3 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-300 flex items-center gap-1.5 backdrop-blur-md">
                  <ShieldCheck size={11} className="text-emerald-400" /> {nickname || "Member"}
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-white tracking-wide leading-tight">Smart Finance Dashboard</h1>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Welcome back, {nickname || "there"} 👋</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {subscriptionPlan === "lite" && (
              <a
                href={`/pricing?user_id=${userId}&mode=upgrade&current_channel=${linkedChannel || ""}&current_plan=${subscriptionPlan}`}
                className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 text-center"
              >
                <Zap size={14} className="fill-slate-950" /> Upgrade Plan 🚀
              </a>
            )}

            {subscriptionPlan === "core" && (
              <a
                href={`/pricing?plan=max&user_id=${userId}&mode=upgrade&current_channel=${linkedChannel || ""}&current_plan=${subscriptionPlan}`}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs px-5 py-2.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 text-center"
              >
                <Sparkles size={14} /> Upgrade to Max 🚀
              </a>
            )}

            {subscriptionPlan === "max" && (
              <button
                disabled
                className="bg-purple-500/20 border border-purple-400/30 text-purple-300 font-bold text-xs px-4 py-2.5 rounded-2xl cursor-default flex items-center justify-center gap-2"
              >
                <Sparkles size={13} /> Max Plan Active
              </button>
            )}

            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-bold text-xs px-4 py-2.5 rounded-2xl transition backdrop-blur-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {portalLoading ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Ban size={13} className="text-rose-400" />
              )}
              {portalLoading ? "Opening..." : "Manage / Cancel Subscription"}
            </button>

            <button onClick={fetchData} className="bg-white/5 hover:bg-white/10 text-slate-200 px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-2 text-xs font-semibold backdrop-blur-md transition shadow-md">
              <RefreshCw size={14} className={loading ? "animate-spin text-emerald-400" : ""} /> Sync
            </button>
            <button onClick={handleLogout} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition backdrop-blur-md shadow-md">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 backdrop-blur-2xl ${
              activeTab === "overview"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 border border-emerald-400 font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <LayoutDashboard size={16} /> Overview
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-6 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 backdrop-blur-2xl ${
              activeTab === "settings"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 border border-emerald-400 font-extrabold"
                : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Settings size={16} /> General Settings
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="bg-slate-900/40 border border-white/10 p-4 sm:p-5 rounded-[28px] backdrop-blur-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 backdrop-blur-md">
                  <Filter size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Summary Date Range</h4>
                  <p className="text-[11px] text-slate-400">Filter the top balance, income, and expense cards</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-2 rounded-2xl backdrop-blur-md">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">From:</span>
                  <input 
                    type="date" 
                    value={summaryFromDate}
                    onChange={(e) => setSummaryFromDate(e.target.value)}
                    className="bg-transparent text-xs text-emerald-400 font-bold focus:outline-none cursor-pointer [color-scheme:dark]"
                  />
                </div>

                <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-2 rounded-2xl backdrop-blur-md">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">To:</span>
                  <input 
                    type="date" 
                    value={summaryToDate}
                    onChange={(e) => setSummaryToDate(e.target.value)}
                    className="bg-transparent text-xs text-emerald-400 font-bold focus:outline-none cursor-pointer [color-scheme:dark]"
                  />
                </div>

                {(summaryFromDate !== firstDayOfMonth || summaryToDate !== todayDate) && (
                  <button 
                    onClick={() => {
                      setSummaryFromDate(firstDayOfMonth);
                      setSummaryToDate(todayDate);
                    }}
                    title="Reset to Current Month"
                    className="p-2 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl transition flex items-center gap-1 text-xs font-semibold backdrop-blur-md"
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/40 border border-white/10 p-6 rounded-[28px] backdrop-blur-2xl relative overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-emerald-500/30 transition duration-300">
                <span className="text-slate-300 text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                  🏢 THIS MONTH BALANCE
                </span>
                <h2 className={`text-2xl sm:text-3xl font-black mt-3 ${accountBalance >= 0 ? 'text-[#00E699]' : 'text-rose-400'}`}>
                  {currency} {accountBalance.toFixed(2)}
                </h2>
                <p className="text-[11px] text-slate-400 mt-2 font-medium">
                  Net remaining for selected period
                </p>
              </div>

              <div className="bg-slate-900/40 border border-white/10 p-6 rounded-[28px] backdrop-blur-2xl relative overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-cyan-500/30 transition duration-300">
                <span className="text-slate-300 text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                  📈 THIS MONTH INCOME
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#00D8F6] mt-3">
                  + {currency} {totalIncome.toFixed(2)}
                </h2>
                <p className="text-[11px] text-slate-400 mt-2 font-medium">
                  Earnings logged for selected period
                </p>
              </div>

              <div className="bg-slate-900/40 border border-white/10 p-6 rounded-[28px] backdrop-blur-2xl relative overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-rose-500/30 transition duration-300">
                <span className="text-slate-300 text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                  📉 THIS MONTH EXPENSE
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#FF4972] mt-3">
                  - {currency} {totalExpense.toFixed(2)}
                </h2>
                <p className="text-[11px] text-slate-400 mt-2 font-medium">
                  Spending logged for selected period
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-slate-900/40 border border-white/10 p-6 rounded-[32px] lg:col-span-2 backdrop-blur-2xl flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <PieIcon size={18} className="text-emerald-400" /> Spending Breakdown
                  </h3>
                  {totalExpense > 0 && (
                    <span className="text-xs font-bold text-slate-400">
                      Total: <span className="text-white">{currency} {totalExpense.toFixed(2)}</span>
                    </span>
                  )}
                </div>

                {pieChartData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center my-auto">
                    <div className="h-60 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={pieChartData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={55} 
                            outerRadius={80} 
                            paddingAngle={5} 
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={CATEGORY_COLORS[entry.name] || "#64748B"} 
                                stroke="#020617" 
                                strokeWidth={2} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(val: any) => `${currency} ${Number(val).toFixed(2)}`} 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', backdropFilter: 'blur(16px)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {pieChartData.map((item) => {
                        const percentage = totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(1) : "0.0";
                        const catColor = CATEGORY_COLORS[item.name] || "#64748B";

                        return (
                          <div key={item.name} className="flex items-center justify-between text-xs bg-black/30 p-2.5 rounded-xl border border-white/5 backdrop-blur-md">
                            <div className="flex items-center gap-2.5">
                              <span 
                                className="w-3 h-3 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: catColor }} 
                              />
                              <span className="font-semibold text-slate-200">{item.name}</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-400">
                                {currency} {item.value.toFixed(2)}
                              </span>
                              <span 
                                className="font-extrabold px-2 py-0.5 rounded-md text-[10px]"
                                style={{ backgroundColor: `${catColor}20`, color: catColor }}
                              >
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-500 text-xs">No expenses logged in this range</div>
                )}
              </div>

              <div className="bg-slate-900/40 border border-white/10 p-6 rounded-[32px] backdrop-blur-2xl flex flex-col justify-between relative overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                      <BarChart3 size={18} className="text-emerald-400" /> {linkedChannel === "telegram" ? "Telegram" : "WhatsApp"} Budget & Remaining
                    </h3>

                    {subscriptionPlan !== "lite" && (
                      <div className="flex items-center gap-2">
                        {!isEditingBudget && (
                          <button
                            onClick={handleOpenAddBudgetModal}
                            disabled={availableBudgetCategories.length === 0}
                            title={availableBudgetCategories.length === 0 ? "Every category already has a budget" : "Add a budget for a new category"}
                            className="text-xs text-slate-300 hover:text-emerald-400 flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-md transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-300"
                          >
                            <Sparkles size={12} /> Add Budget
                          </button>
                        )}
                        {isEditingBudget ? (
                          <>
                            <button onClick={handleCancelEditBudget} className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-md transition">
                              <X size={12} /> Cancel
                            </button>
                            <button onClick={handleSaveBudget} className="text-xs bg-emerald-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                              <Check size={12} strokeWidth={3} /> Save
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setIsEditingBudget(true)} className="text-xs text-slate-300 hover:text-emerald-400 flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-md transition">
                            <Edit2 size={12} /> Edit Targets
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {subscriptionPlan !== "lite" && (
                    <div className="flex items-center justify-center gap-3 mb-3 bg-black/30 border border-white/5 rounded-xl py-1.5 px-2">
                      <button
                        type="button"
                        onClick={handleBudgetPrevMonth}
                        title="Previous month"
                        className="text-slate-400 hover:text-emerald-400 p-1 rounded-lg hover:bg-white/5 transition"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs font-extrabold text-white min-w-[110px] text-center">
                        {budgetViewDate.toLocaleString("default", { month: "long", year: "numeric" })}
                      </span>
                      <button
                        type="button"
                        onClick={handleBudgetNextMonth}
                        disabled={isBudgetViewCurrentMonth}
                        title={isBudgetViewCurrentMonth ? "Already viewing the current month" : "Next month"}
                        className="text-slate-400 hover:text-emerald-400 p-1 rounded-lg hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                      >
                        <ChevronRight size={14} />
                      </button>
                      {!isBudgetViewCurrentMonth && (
                        <button
                          type="button"
                          onClick={() => setBudgetViewDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-2 ml-1"
                        >
                          Today
                        </button>
                      )}
                    </div>
                  )}

                  {subscriptionPlan !== "lite" && monthlyBudget > 0 && (() => {
                    const overallRemaining = monthlyBudget - currentMonthExpense;
                    const overallPct = Math.min(100, (currentMonthExpense / monthlyBudget) * 100);
                    const overallOver = overallRemaining < 0;
                    return (
                      <div className="bg-black/40 border border-white/5 p-3.5 rounded-2xl backdrop-blur-md mb-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200 flex items-center gap-1.5">
                            <Wallet size={12} className="text-emerald-400" /> Overall Monthly Budget
                          </span>
                          <span className={`text-[11px] font-extrabold ${overallOver ? "text-rose-400" : "text-emerald-400"}`}>
                            {overallPct.toFixed(0)}% used
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              overallOver ? "bg-rose-500" : overallPct >= 80 ? "bg-amber-400" : "bg-emerald-500"
                            }`}
                            style={{ width: `${overallPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Spent: <strong className="text-rose-400">{currency} {currentMonthExpense.toFixed(2)}</strong> / {currency} {monthlyBudget.toFixed(2)}</span>
                          <span>
                            {overallOver ? "Over by" : "Remaining"}: <strong className={overallOver ? "text-rose-400" : "text-emerald-400"}>{currency} {Math.abs(overallRemaining).toFixed(2)}</strong>
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 pt-0.5">Tracks {budgetViewDate.toLocaleString("default", { month: "long", year: "numeric" })} only, regardless of the date filter above.</p>
                      </div>
                    );
                  })()}

                  {subscriptionPlan === "lite" ? (
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-6 text-center space-y-4 my-auto backdrop-blur-md">
                      <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md">
                        <Lock size={22} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-white">Category Budgets Locked</h4>
                        <p className="text-[11px] text-slate-400 mt-1">Upgrade to Core or Max to track WhatsApp category spending and remaining limits.</p>
                      </div>
                      <a 
                        href={`/pricing?user_id=${userId}&mode=upgrade&current_channel=${linkedChannel || ""}&current_plan=${subscriptionPlan}`}
                        className="w-full inline-block bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-black py-2.5 rounded-xl transition shadow-lg shadow-amber-500/10 text-center"
                      >
                        Upgrade Plan 🚀
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-2">
                      <p className="text-[11px] text-slate-400 mb-2">Track category spending sent via WhatsApp & check remaining balances ({budgetViewDate.toLocaleString("default", { month: "long" })}):</p>
                      
                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {Object.keys(categoryBudgets).length > 0 ? (
                          Object.keys(categoryBudgets).map((cat) => {
                            const limit = categoryBudgets[cat] || 0;
                            const spent = categoryMonthExpenses[cat] || 0;
                            const remaining = limit - spent;
                            const isOver = remaining < 0;
                            const catPct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
                            const catColor = CATEGORY_COLORS[cat] || "#10B981";

                            return (
                              <div key={cat} className="bg-black/40 border border-white/5 p-3 rounded-2xl backdrop-blur-md space-y-2">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  {isEditingBudget ? (
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: catColor }} />
                                      <select
                                        value={tempCatNames[cat] ?? cat}
                                        onChange={(e) => setTempCatNames({ ...tempCatNames, [cat]: e.target.value })}
                                        className="min-w-0 flex-1 bg-slate-950 border border-white/10 text-[11px] text-slate-200 font-bold px-2 py-1 rounded-lg focus:border-emerald-500 focus:outline-none"
                                      >
                                        <option value={cat}>{cat}</option>
                                        {availableBudgetCategories.map((c) => (
                                          <option key={c} value={c}>{c}</option>
                                        ))}
                                      </select>
                                    </div>
                                  ) : (
                                    <span className="font-bold text-slate-200 flex items-center gap-2 min-w-0">
                                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: catColor }} />
                                      <span className="truncate">{cat}</span>
                                    </span>
                                  )}

                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {isEditingBudget ? (
                                      <input 
                                        type="number"
                                        value={tempCatBudgets[cat] ?? limit}
                                        onChange={(e) => setTempCatBudgets({...tempCatBudgets, [cat]: e.target.value})}
                                        className="w-20 bg-slate-950 border border-emerald-500 text-xs text-white px-2 py-0.5 rounded-lg text-right"
                                      />
                                    ) : (
                                      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                                        Limit: <strong className="text-white">{currency} {limit.toFixed(2)}</strong>
                                      </span>
                                    )}
                                    {isEditingBudget && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteBudgetCategory(cat)}
                                        disabled={deletingBudgetCat === cat}
                                        title={`Remove ${cat} budget`}
                                        className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition disabled:opacity-40"
                                      >
                                        {deletingBudgetCat === cat ? (
                                          <RefreshCw size={12} className="animate-spin" />
                                        ) : (
                                          <Trash2 size={12} />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {!isEditingBudget && limit > 0 && (
                                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${catPct}%`,
                                        backgroundColor: isOver ? "#F43F5E" : catColor
                                      }}
                                    />
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400">Spent: <strong className="text-rose-400">{currency} {spent.toFixed(2)}</strong></span>
                                  <span className="text-slate-400">
                                    {isOver ? "Over by" : "Remaining"}: <strong className={isOver ? "text-rose-400" : "text-emerald-400"}>{currency} {Math.abs(remaining).toFixed(2)}</strong>
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-10 text-slate-500 text-xs space-y-2">
                            <p>No category budgets set</p>
                            <button
                              onClick={handleOpenAddBudgetModal}
                              className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-2"
                            >
                              Add your first budget
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-white/10 p-6 rounded-[32px] space-y-6 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h3 className="font-extrabold text-lg text-white">Recent Transactions</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Edit, filter transactions by date range or search terms</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition shadow-md shadow-emerald-500/10"
                  >
                    <Sparkles size={14} /> Add Transaction
                  </button>

                  <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1.5 rounded-2xl backdrop-blur-md">
                    <div className="flex items-center gap-1.5 px-2">
                      <Calendar size={14} className="text-emerald-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-xs text-white focus:outline-none cursor-pointer [color-scheme:dark]"
                      />
                    </div>
                    
                    <span className="text-slate-600 font-bold">-</span>

                    <div className="flex items-center gap-1.5 px-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-xs text-white focus:outline-none cursor-pointer [color-scheme:dark]"
                      />
                    </div>

                    {(startDate || endDate) && (
                      <button 
                        onClick={() => { setStartDate(""); setEndDate(""); }}
                        title="Reset Date Range"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-xl transition"
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}
                  </div>

                  <input 
                    type="text" 
                    placeholder="Search note or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/40 border border-white/10 text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 transition backdrop-blur-md"
                  />

                  {subscriptionPlan === "lite" ? (
                    <button 
                      disabled
                      title="Available in Core & Max Plan"
                      className="bg-white/5 text-slate-500 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 opacity-60 cursor-not-allowed border border-white/5"
                    >
                      <Lock size={13} /> Export Excel 📊
                    </button>
                  ) : (
                    <button 
                      onClick={handleExportExcel}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition whitespace-nowrap shadow-md shadow-emerald-500/10"
                    >
                      <Download size={14} /> Export Excel 📊
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Merchant / Note</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((tx) => {
                        const isEditing = editingId === tx.id;

                        return (
                          <tr key={tx.id} className="hover:bg-white/5 transition">
                            <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                              {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "Today"}
                            </td>

                            <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  value={editItem} 
                                  onChange={(e) => setEditItem(e.target.value)} 
                                  className="bg-black/60 border border-emerald-500 px-2 py-1 rounded-lg text-xs text-white focus:outline-none"
                                />
                              ) : (
                                tx.item
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isEditing ? (
                                <select 
                                  value={editCategory} 
                                  onChange={(e) => setEditCategory(e.target.value)}
                                  className="bg-black/60 border border-emerald-500 px-2 py-1 rounded-lg text-xs text-white focus:outline-none"
                                >
                                  {CATEGORY_OPTIONS.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg font-semibold text-[10px] bg-white/5 text-slate-300 border border-white/10 backdrop-blur-md">
                                  {tx.category || "Other"}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-extrabold whitespace-nowrap">
                              {isEditing ? (
                                <input 
                                  type="number" 
                                  value={editAmount} 
                                  onChange={(e) => setEditAmount(e.target.value)} 
                                  className="bg-black/60 border border-emerald-500 px-2 py-1 rounded-lg text-xs text-white w-24 focus:outline-none"
                                />
                              ) : (
                                <span className={tx.type === "income" ? "text-emerald-400" : "text-slate-200"}>
                                  {currency} {Number(tx.amount || 0).toFixed(2)}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isEditing ? (
                                <select 
                                  value={editType} 
                                  onChange={(e) => setEditType(e.target.value as "income" | "expense")}
                                  className="bg-black/60 border border-emerald-500 px-2 py-1 rounded-lg text-xs text-white focus:outline-none"
                                >
                                  <option value="expense">Expense</option>
                                  <option value="income">Income</option>
                                </select>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase backdrop-blur-md ${
                                  tx.type === "income" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                }`}>
                                  {tx.type}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap uppercase text-[10px] font-mono">
                              {tx.entry_type || "text"}
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button 
                                    onClick={() => handleSaveEdit(tx.id)} 
                                    disabled={saveLoading}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-1.5 rounded-lg transition shadow-md"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button 
                                    onClick={handleCancelEdit} 
                                    className="bg-white/10 hover:bg-white/20 text-slate-300 p-1.5 rounded-lg transition backdrop-blur-md"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button 
                                    onClick={() => handleStartEdit(tx)} 
                                    className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition border border-white/10 backdrop-blur-md"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteTransaction(tx)} 
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg transition border border-rose-500/20 backdrop-blur-md"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                          No transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900/40 border border-white/10 p-6 rounded-[32px] backdrop-blur-2xl space-y-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <User size={18} className="text-emerald-400" /> User Profile Settings
              </h3>

              {profileMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 backdrop-blur-md ${
                  profileMsg.type === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}>
                  {profileMsg.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div>
                  <label className="text-xs text-slate-300 font-bold mb-3 flex items-center gap-1.5">
                    <Camera size={13} className="text-emerald-400" /> Profile Picture
                  </label>

                  <div className="bg-black/30 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="p-[2.5px] rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/10">
                          <img
                            src={selectedAvatar || avatarUrl}
                            alt="Selected Profile"
                            className="w-16 h-16 rounded-[15px] object-cover bg-slate-950"
                          />
                        </div>
                        {uploadingImg && (
                          <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                            <RefreshCw size={16} className="animate-spin text-emerald-400" />
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-lg border-2 border-black/30 shadow-sm">
                          <Check size={9} strokeWidth={4} />
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor="custom-avatar-upload"
                          className="cursor-pointer inline-flex bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/10 items-center gap-2 transition backdrop-blur-md w-full sm:w-auto justify-center"
                        >
                          <Camera size={14} className="text-emerald-400" /> Upload Custom Photo
                        </label>
                        <input
                          id="custom-avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleCustomImageUpload}
                          className="hidden"
                        />
                        <p className="text-[10px] text-slate-400 mt-1.5">JPG, PNG or WEBP · Max 2MB</p>
                      </div>
                    </div>

                    <div className="h-px bg-white/10 my-4" />

                    <span className="text-[11px] text-slate-400 font-semibold block mb-2.5">Or choose a preset avatar</span>
                    <div className="flex items-center gap-3 overflow-x-auto pb-1">
                      {AVATAR_OPTIONS.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedAvatar(imgUrl)}
                          className={`relative rounded-2xl p-1 transition-all border-2 flex-shrink-0 ${
                            selectedAvatar === imgUrl 
                              ? "border-emerald-400 bg-emerald-500/20 scale-105 shadow-md shadow-emerald-500/10" 
                              : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                          }`}
                        >
                          <img 
                            src={imgUrl} 
                            alt={`Avatar ${idx + 1}`} 
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          {selectedAvatar === imgUrl && (
                            <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 rounded-full p-0.5">
                              <Check size={10} strokeWidth={4} />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1.5">Display Name / How to Call You</label>
                  <input 
                    type="text" 
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter your nickname..."
                    className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition backdrop-blur-md"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Mail size={13} className="text-slate-400" /> Email Address</span>
                    <span className="text-[10px] text-slate-500 font-medium">(Read-only)</span>
                  </label>
                  <input 
                    type="email" 
                    value={userEmail}
                    readOnly
                    disabled
                    className="w-full bg-slate-950/60 border border-white/5 text-xs text-slate-400 p-3 rounded-xl cursor-not-allowed backdrop-blur-md"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1.5 flex items-center gap-1.5">
                    <Phone size={13} className="text-emerald-400" /> Phone Number (For WhatsApp / SMS Notifications)
                  </label>
                  <input 
                    type="text" 
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+947XXXXXXXX"
                    className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition backdrop-blur-md"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1.5">Preferred Currency</label>
                  <select 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition backdrop-blur-md [color-scheme:dark]"
                  >
                    {WORLD_CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code} className="bg-slate-950 text-slate-100">
                        {curr.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe size={14} /> Financial & Regional Preferences
                  </h4>

                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1.5">
                      Language: Dashboard App Language (World Languages)
                    </label>
                    <select 
                      name="language"
                      value={appLanguage}
                      onChange={(e) => setAppLanguage(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition backdrop-blur-md [color-scheme:dark]"
                    >
                      {WORLD_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-slate-950 text-slate-100">
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1.5">
                      Date Format: (DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD)
                    </label>
                    <select 
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition backdrop-blur-md [color-scheme:dark]"
                    >
                      <option value="DD/MM/YYYY" className="bg-slate-950 text-slate-100">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY" className="bg-slate-950 text-slate-100">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD" className="bg-slate-950 text-slate-100">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-bold block mb-1.5">
                      First Day of the Week: (Monday or Sunday)
                    </label>
                    <select 
                      value={weekStart}
                      onChange={(e) => setWeekStart(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition backdrop-blur-md [color-scheme:dark]"
                    >
                      <option value="Monday" className="bg-slate-950 text-slate-100">Monday</option>
                      <option value="Sunday" className="bg-slate-950 text-slate-100">Sunday</option>
                    </select>
                  </div>

                </div>

                <button 
                  type="submit" 
                  disabled={profileLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10"
                >
                  {profileLoading ? <RefreshCw size={14} className="animate-spin" /> : "Save Profile Settings"}
                </button>
              </form>
            </div>

            <div className="bg-slate-900/40 border border-white/10 p-6 rounded-[32px] backdrop-blur-2xl space-y-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] h-fit">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <ShieldCheck size={18} className="text-emerald-400" /> Security Settings
              </h3>

              {passwordMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 backdrop-blur-md ${
                  passwordMsg.type === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}>
                  {passwordMsg.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {passwordMsg.text}
                </div>
              )}

              {otpStep === "form" ? (
                <form onSubmit={handleRequestPasswordOtp} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1.5">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition backdrop-blur-md"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1.5">Confirm Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition backdrop-blur-md"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={passwordLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10"
                  >
                    {passwordLoading ? <RefreshCw size={14} className="animate-spin" /> : <><Mail size={14} /> Send Verification Code</>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpAndChangePassword} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1.5">
                      Enter the 6-digit code sent to {userEmail}
                    </label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full bg-black/40 border border-white/10 text-sm tracking-[0.4em] text-center text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition backdrop-blur-md"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={otpLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10"
                  >
                    {otpLoading ? <RefreshCw size={14} className="animate-spin" /> : "Verify & Update Password"}
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <button 
                      type="button" 
                      onClick={handleCancelOtp}
                      className="hover:text-slate-200 transition font-semibold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      disabled={otpResendCooldown > 0 || otpLoading}
                      className="hover:text-emerald-300 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpResendCooldown > 0 ? `Resend code in ${otpResendCooldown}s` : "Resend code"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-white/10 rounded-[28px] p-6 w-full max-w-sm space-y-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white">Add Transaction</h3>
              <button onClick={handleCloseAddModal} className="p-1.5 text-slate-400 hover:text-white transition">
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1.5">Description</label>
              <input
                type="text"
                value={addItem}
                onChange={(e) => setAddItem(e.target.value)}
                placeholder="e.g. Bus fare"
                className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1.5">Category</label>
              <select
                value={addCategory}
                onChange={(e) => setAddCategory(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition [color-scheme:dark]"
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c} className="bg-slate-950 text-slate-100">{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1.5">Amount</label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1.5">Type</label>
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as "income" | "expense")}
                  className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition [color-scheme:dark]"
                >
                  <option value="expense" className="bg-slate-950 text-slate-100">Expense</option>
                  <option value="income" className="bg-slate-950 text-slate-100">Income</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleAddTransaction}
              disabled={addLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 disabled:opacity-60"
            >
              {addLoading ? <RefreshCw size={14} className="animate-spin" /> : "Save Transaction"}
            </button>
          </div>
        </div>
      )}

      {showAddBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-white/10 rounded-[28px] p-6 w-full max-w-sm space-y-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-white">Add Budget</h3>
              <button onClick={handleCloseAddBudgetModal} className="p-1.5 text-slate-400 hover:text-white transition">
                <X size={16} />
              </button>
            </div>

            {availableBudgetCategories.length === 0 ? (
              <p className="text-xs text-slate-400">Every category already has a budget — edit its limit from "Edit Targets" instead.</p>
            ) : (
              <>
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">Category</label>
                  <select
                    value={addBudgetCategory}
                    onChange={(e) => setAddBudgetCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition [color-scheme:dark]"
                  >
                    {availableBudgetCategories.map(c => (
                      <option key={c} value={c} className="bg-slate-950 text-slate-100">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">Monthly Limit ({currency})</label>
                  <input
                    type="number"
                    value={addBudgetAmount}
                    onChange={(e) => setAddBudgetAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black/40 border border-white/10 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <button
                  onClick={handleAddBudget}
                  disabled={addBudgetLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 disabled:opacity-60"
                >
                  {addBudgetLoading ? <RefreshCw size={14} className="animate-spin" /> : "Save Budget"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900/95 border border-white/10 text-slate-100 text-xs font-semibold px-4 py-3 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          <span className="whitespace-nowrap">
            Deleted <span className="text-white">{pendingDelete.tx.item || "transaction"}</span>
          </span>
          <button
            onClick={handleUndoDelete}
            className="text-emerald-400 hover:text-emerald-300 font-extrabold uppercase tracking-wide transition"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}