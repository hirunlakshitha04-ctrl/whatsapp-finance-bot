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
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2,
  Lock,
  Mail,
  KeyRound,
  Loader2,
  Clock
} from "lucide-react";

// Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const WORLD_COUNTRIES = [
  "United States", "Sri Lanka", "United Kingdom", "Australia", "Canada", "United Arab Emirates",
  "Qatar", "Saudi Arabia", "Kuwait", "Singapore", "Malaysia", "India", "Germany", "France", "Italy",
  "Japan", "South Korea", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola",
  "Antigua and Barbuda", "Argentina", "Armenia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Central African Republic", "Chad", "Chile", "China",
  "Colombia", "Comoros", "Congo (Republic of the)", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica",
  "Dominican Republic", "East Timor (Timor-Leste)", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "Gabon",
  "Gambia", "Georgia", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Ivory Coast (Côte d'Ivoire)", "Jamaica", "Jordan", "Kazakhstan", "Kenya",
  "Kiribati", "Kosovo", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Macau", "Madagascar", "Malawi", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
  "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay",
  "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa",
  "San Marino", "Sao Tome and Principe", "Senegal", "Serbia", "Seychelles", "Sierra Leone",
  "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain",
  "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe"
];

// Major Timezones
const WORLD_TIMEZONES = [
  { value: "Asia/Colombo", label: "(UTC+05:30) Sri Lanka, India" },
  { value: "UTC", label: "(UTC+00:00) UTC / GMT" },
  { value: "America/New_York", label: "(UTC-05:00) Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "(UTC-06:00) Central Time (US & Canada)" },
  { value: "America/Denver", label: "(UTC-07:00) Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "(UTC-08:00) Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "(UTC+00:00) London, Dublin, Edinburgh" },
  { value: "Europe/Paris", label: "(UTC+01:00) Paris, Berlin, Rome, Madrid" },
  { value: "Asia/Dubai", label: "(UTC+04:00) Dubai, Abu Dhabi, Muscat" },
  { value: "Asia/Riyadh", label: "(UTC+03:00) Riyadh, Qatar, Kuwait" },
  { value: "Asia/Singapore", label: "(UTC+08:00) Singapore, Kuala Lumpur" },
  { value: "Asia/Tokyo", label: "(UTC+09:00) Tokyo, Osaka, Seoul" },
  { value: "Australia/Sydney", label: "(UTC+10:00) Sydney, Melbourne, Canberra" },
  { value: "Pacific/Auckland", label: "(UTC+12:00) Auckland, Wellington" }
];

const WORLD_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "si", name: "සිංහල (Sinhala)" },
  { code: "singlish", name: "Singlish (Sinhala + English mix)" },
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
  { code: "th", name: "ไทย (Thai)" },
  { code: "fa", name: "فارسی (Persian/Farsi)" },
  { code: "pl", name: "Polski (Polish)" },
  { code: "uk", name: "Українська (Ukrainian)" },
  { code: "ro", name: "Română (Romanian)" },
  { code: "el", name: "Ελληνικά (Greek)" },
  { code: "cs", name: "Čeština (Czech)" },
  { code: "sv", name: "Svenska (Swedish)" },
  { code: "no", name: "Norsk (Norwegian)" },
  { code: "da", name: "Dansk (Danish)" },
  { code: "fi", name: "Suomi (Finnish)" },
  { code: "hu", name: "Magyar (Hungarian)" },
  { code: "he", name: "עברית (Hebrew)" },
  { code: "sw", name: "Kiswahili (Swahili)" },
  { code: "am", name: "አማርኛ (Amharic)" },
  { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yorùbá (Yoruba)" },
  { code: "ig", name: "Igbo" },
  { code: "zu", name: "isiZulu (Zulu)" },
  { code: "xh", name: "isiXhosa (Xhosa)" },
  { code: "af", name: "Afrikaans" },
  { code: "ne", name: "ਨੇपाली (Nepali)" },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "gu", name: "ગુજરાતી (Gujarati)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "kn", name: "කන්නඩා (Kannada)" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
  { code: "my", name: "မြန်မာ (Burmese)" },
  { code: "km", name: "ខ្មែរ (Khmer)" },
  { code: "lo", name: "ລາວ (Lao)" },
  { code: "ka", name: "ქართული (Georgian)" },
  { code: "hy", name: "Հայերեն (Armenian)" },
  { code: "az", name: "Azərbaycan dili (Azerbaijani)" },
  { code: "kk", name: "Қазақ тілі (Kazakh)" },
  { code: "uz", name: "O'zbek tili (Uzbek)" },
  { code: "mn", name: "Монгол (Mongolian)" },
  { code: "sr", name: "Српски (Serbian)" },
  { code: "hr", name: "Hrvatski (Croatian)" },
  { code: "bg", name: "Български (Bulgarian)" },
  { code: "sk", name: "Slovenčina (Slovak)" },
  { code: "sl", name: "Slovenščina (Slovenian)" },
  { code: "lt", name: "Lietuvių (Lithuanian)" },
  { code: "lv", name: "Latviešu (Latvian)" },
  { code: "et", name: "Eesti (Estonian)" },
  { code: "sq", name: "Shqip (Albanian)" },
  { code: "mk", name: "Македонски (Macedonian)" },
  { code: "bs", name: "Bosanski (Bosnian)" },
  { code: "is", name: "Íslenska (Icelandic)" },
  { code: "ga", name: "Gaeilge (Irish)" },
  { code: "cy", name: "Cymraeg (Welsh)" },
  { code: "tl", name: "Tagalog (Filipino)" },
  { code: "so", name: "Soomaali (Somali)" },
  { code: "ps", name: "پښتو (Pashto)" },
  { code: "ku", name: "Kurdî (Kurdish)" },
  { code: "sd", name: "سنڌي (Sindhi)" }
];

const LANGUAGE_NAME_MAP: Record<string, string> = {
  en: "English",
  si: "Sinhala",
  singlish: "Singlish",
  ta: "Tamil",
  ar: "Arabic",
  es: "Spanish",
  fr: "French",
  de: "German",
  zh: "Chinese",
  hi: "Hindi",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  it: "Italian",
  nl: "Dutch",
  tr: "Turkish",
  ur: "Urdu",
  bn: "Bengali",
  id: "Indonesian",
  ms: "Malay",
  vi: "Vietnamese",
  th: "Thai",
  fa: "Persian",
  pl: "Polish",
  uk: "Ukrainian",
  ro: "Romanian",
  el: "Greek",
  cs: "Czech",
  sv: "Swedish",
  no: "Norwegian",
  da: "Danish",
  fi: "Finnish",
  hu: "Hungarian",
  he: "Hebrew",
  sw: "Swahili",
  am: "Amharic",
  ha: "Hausa",
  yo: "Yoruba",
  ig: "Igbo",
  zu: "Zulu",
  xh: "Xhosa",
  af: "Afrikaans",
  ne: "Nepali",
  pa: "Punjabi",
  gu: "Gujarati",
  mr: "Marathi",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  my: "Burmese",
  km: "Khmer",
  lo: "Lao",
  ka: "Georgian",
  hy: "Armenian",
  az: "Azerbaijani",
  kk: "Kazakh",
  uz: "Uzbek",
  mn: "Mongolian",
  sr: "Serbian",
  hr: "Croatian",
  bg: "Bulgarian",
  sk: "Slovak",
  sl: "Slovenian",
  lt: "Lithuanian",
  lv: "Latvian",
  et: "Estonian",
  sq: "Albanian",
  mk: "Macedonian",
  bs: "Bosnian",
  is: "Icelandic",
  ga: "Irish",
  cy: "Welsh",
  tl: "Filipino",
  so: "Somali",
  ps: "Pashto",
  ku: "Kurdish",
  sd: "Sindhi"
};

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
  { code: "BDT", name: "BDT - Bangladeshi Taka" },
  { code: "AFN", name: "AFN - Afghan Afghani" },
  { code: "ALL", name: "ALL - Albanian Lek" },
  { code: "AMD", name: "AMD - Armenian Dram" },
  { code: "ANG", name: "ANG - Netherlands Antillean Guilder" },
  { code: "AOA", name: "AOA - Angolan Kwanza" },
  { code: "ARS", name: "ARS - Argentine Peso" },
  { code: "AWG", name: "AWG - Aruban Florin" },
  { code: "AZN", name: "AZN - Azerbaijani Manat" },
  { code: "BAM", name: "BAM - Bosnia-Herzegovina Convertible Mark" },
  { code: "BBD", name: "BBD - Barbadian Dollar" },
  { code: "BGN", name: "BGN - Bulgarian Lev" },
  { code: "BIF", name: "BIF - Burundian Franc" },
  { code: "BMD", name: "BMD - Bermudan Dollar" },
  { code: "BND", name: "BND - Brunei Dollar" },
  { code: "BOB", name: "BOB - Bolivian Boliviano" },
  { code: "BSD", name: "BSD - Bahamian Dollar" },
  { code: "BTN", name: "BTN - Bhutanese Ngultrum" },
  { code: "BWP", name: "BWP - Botswanan Pula" },
  { code: "BYN", name: "BYN - Belarusian Ruble" },
  { code: "BZD", name: "BZD - Belize Dollar" },
  { code: "CDF", name: "CDF - Congolese Franc" },
  { code: "CLP", name: "CLP - Chilean Peso" },
  { code: "COP", name: "COP - Colombian Peso" },
  { code: "CRC", name: "CRC - Costa Rican Colón" },
  { code: "CUP", name: "CUP - Cuban Peso" },
  { code: "CVE", name: "CVE - Cape Verdean Escudo" },
  { code: "CZK", name: "CZK - Czech Koruna" },
  { code: "DJF", name: "DJF - Djiboutian Franc" },
  { code: "DKK", name: "DKK - Danish Krone" },
  { code: "DOP", name: "DOP - Dominican Peso" },
  { code: "DZD", name: "DZD - Algerian Dinar" },
  { code: "EGP", name: "EGP - Egyptian Pound" },
  { code: "ERN", name: "ERN - Eritrean Nakfa" },
  { code: "ETB", name: "ETB - Ethiopian Birr" },
  { code: "FJD", name: "FJD - Fijian Dollar" },
  { code: "GEL", name: "GEL - Georgian Lari" },
  { code: "GHS", name: "GHS - Ghanaian Cedi" },
  { code: "GMD", name: "GMD - Gambian Dalasi" },
  { code: "GNF", name: "GNF - Guinean Franc" },
  { code: "GTQ", name: "GTQ - Guatemalan Quetzal" },
  { code: "GYD", name: "GYD - Guyanaese Dollar" },
  { code: "HKD", name: "HKD - Hong Kong Dollar" },
  { code: "HNL", name: "HNL - Honduran Lempira" },
  { code: "HRK", name: "HRK - Croatian Kuna" },
  { code: "HTG", name: "HTG - Haitian Gourde" },
  { code: "HUF", name: "HUF - Hungarian Forint" },
  { code: "IDR", name: "IDR - Indonesian Rupiah" },
  { code: "ILS", name: "ILS - Israeli New Shekel" },
  { code: "IQD", name: "IQD - Iraqi Dinar" },
  { code: "IRR", name: "IRR - Iranian Rial" },
  { code: "ISK", name: "ISK - Icelandic Króna" },
  { code: "JMD", name: "JMD - Jamaican Dollar" },
  { code: "JOD", name: "JOD - Jordanian Dinar" },
  { code: "KES", name: "KES - Kenyan Shilling" },
  { code: "KGS", name: "KGS - Kyrgystani Som" },
  { code: "KHR", name: "KHR - Cambodian Riel" },
  { code: "KMF", name: "KMF - Comorian Franc" },
  { code: "KPW", name: "KPW - North Korean Won" },
  { code: "KYD", name: "KYD - Cayman Islands Dollar" },
  { code: "KZT", name: "KZT - Kazakhstani Tenge" },
  { code: "LAK", name: "LAK - Laotian Kip" },
  { code: "LBP", name: "LBP - Lebanese Pound" },
  { code: "LRD", name: "LRD - Liberian Dollar" },
  { code: "LSL", name: "LSL - Lesotho Loti" },
  { code: "LYD", name: "LYD - Libyan Dinar" },
  { code: "MAD", name: "MAD - Moroccan Dirham" },
  { code: "MDL", name: "MDL - Moldovan Leu" },
  { code: "MGA", name: "MGA - Malagasy Ariary" },
  { code: "MKD", name: "MKD - Macedonian Denar" },
  { code: "MMK", name: "MMK - Myanmar Kyat" },
  { code: "MNT", name: "MNT - Mongolian Tugrik" },
  { code: "MOP", name: "MOP - Macanese Pataca" },
  { code: "MRU", name: "MRU - Mauritanian Ouguiya" },
  { code: "MUR", name: "MUR - Mauritian Rupee" },
  { code: "MVR", name: "MVR - Maldivian Rufiyaa" },
  { code: "MWK", name: "MWK - Malawian Kwacha" },
  { code: "MXN", name: "MXN - Mexican Peso" },
  { code: "MZN", name: "MZN - Mozambican Metical" },
  { code: "NAD", name: "NAD - Namibian Dollar" },
  { code: "NGN", name: "NGN - Nigerian Naira" },
  { code: "NIO", name: "NIO - Nicaraguan Córdoba" },
  { code: "NOK", name: "NOK - Norwegian Krone" },
  { code: "NPR", name: "NPR - Nepalese Rupee" },
  { code: "PAB", name: "PAB - Panamanian Balboa" },
  { code: "PEN", name: "PEN - Peruvian Sol" },
  { code: "PGK", name: "PGK - Papua New Guinean Kina" },
  { code: "PHP", name: "PHP - Philippine Peso" },
  { code: "PLN", name: "PLN - Polish Złoty" },
  { code: "PYG", name: "PYG - Paraguayan Guarani" },
  { code: "RON", name: "RON - Romanian Leu" },
  { code: "RSD", name: "RSD - Serbian Dinar" },
  { code: "RWF", name: "RWF - Rwandan Franc" },
  { code: "SBD", name: "SBD - Solomon Islands Dollar" },
  { code: "SCR", name: "SCR - Seychellois Rupee" },
  { code: "SDG", name: "SDG - Sudanese Pound" },
  { code: "SEK", name: "SEK - Swedish Krona" },
  { code: "SLL", name: "SLL - Sierra Leonean Leone" },
  { code: "SOS", name: "SOS - Somali Shilling" },
  { code: "SRD", name: "SRD - Surinamese Dollar" },
  { code: "SSP", name: "SSP - South Sudanese Pound" },
  { code: "STN", name: "STN - São Tomé and Príncipe Dobra" },
  { code: "SYP", name: "SYP - Syrian Pound" },
  { code: "SZL", name: "SZL - Eswatini Lilangeni" },
  { code: "TJS", name: "TJS - Tajikistani Somoni" },
  { code: "TMT", name: "TMT - Turkmenistani Manat" },
  { code: "TND", name: "TND - Tunisian Dinar" },
  { code: "TOP", name: "TOP - Tongan Paʻanga" },
  { code: "TRY", name: "TRY - Turkish Lira" },
  { code: "TTD", name: "TTD - Trinidad and Tobago Dollar" },
  { code: "TWD", name: "TWD - New Taiwan Dollar" },
  { code: "TZS", name: "TZS - Tanzanian Shilling" },
  { code: "UAH", name: "UAH - Ukrainian Hryvnia" },
  { code: "UGX", name: "UGX - Ugandan Shilling" },
  { code: "UYU", name: "UYU - Uruguayan Peso" },
  { code: "UZS", name: "UZS - Uzbekistani Som" },
  { code: "VES", name: "VES - Venezuelan Bolívar" },
  { code: "VND", name: "VND - Vietnamese Đồng" },
  { code: "VUV", name: "VUV - Vanuatu Vatu" },
  { code: "WST", name: "WST - Samoan Tala" },
  { code: "XAF", name: "XAF - Central African CFA Franc" },
  { code: "XCD", name: "XCD - East Caribbean Dollar" },
  { code: "XOF", name: "XOF - West African CFA Franc" },
  { code: "XPF", name: "XPF - CFP Franc" },
  { code: "YER", name: "YER - Yemeni Rial" },
  { code: "ZMW", name: "ZMW - Zambian Kwacha" }
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
    country: "Sri Lanka",
    language: "en",
    currency: "USD",
    timezone: "Asia/Colombo",
    nickname: "",
    privacy_accepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setIsMounted(true);
    try {
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (userTz) {
        setFormData((prev) => ({ ...prev, timezone: userTz }));
      }
    } catch (e) {
      console.warn("Timezone detection error:", e);
    }
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

  const handleRedirect = (cleanedPhone: string) => {
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const currentPlan = (urlParams?.get("plan") || planParam || "free").toLowerCase().trim();

    if (currentPlan === "free" || currentPlan === "lite") {
      const botPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "+14155238886";
      const defaultText = encodeURIComponent("Hi Broo, I just registered on the Free plan!");
      window.location.href = `https://wa.me/${botPhoneNumber.replace("+", "")}?text=${defaultText}`;
      return;
    }

    let lemonBaseUrl = "";

    if (currentPlan === "core") {
      lemonBaseUrl = "https://brooai.lemonsqueezy.com/checkout/buy/a54c9cf8-5ad7-416e-bfb2-dc503f724b56";
    } else if (currentPlan === "max" || currentPlan === "pro" || currentPlan === "orbit") {
      lemonBaseUrl = "https://brooai.lemonsqueezy.com/checkout/buy/8263b48a-6d77-492d-a951-4d239bb57a15";
    } else {
      lemonBaseUrl = "https://brooai.lemonsqueezy.com/checkout/buy/a54c9cf8-5ad7-416e-bfb2-dc503f724b56";
    }

    const queryParams = new URLSearchParams();
    if (cleanedPhone) queryParams.append("checkout[custom][phone]", cleanedPhone);
    if (formData.email) queryParams.append("checkout[email]", formData.email);
    if (formData.name) queryParams.append("checkout[name]", formData.name);

    window.location.href = `${lemonBaseUrl}?${queryParams.toString()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (!formData.privacy_accepted) {
      setErrorMsg("Please accept the Privacy Policy & Terms to proceed.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (!formData.phone_number.trim()) {
      setErrorMsg("Please enter a valid WhatsApp phone number.");
      setLoading(false);
      return;
    }

    // Phone number sanitization
    let cleanedPhone = formData.phone_number.trim().replace(/[^0-9+]/g, "");
    if (cleanedPhone.startsWith("0")) {
      cleanedPhone = "+94" + cleanedPhone.slice(1);
    } else if (!cleanedPhone.startsWith("+")) {
      cleanedPhone = `+${cleanedPhone}`;
    }

    const resolvedLanguage = LANGUAGE_NAME_MAP[formData.language] || "English";
    const isFreePlan = planParam.toLowerCase() === "free" || planParam.toLowerCase() === "lite";

    try {
      const { data: dupCheck, error: dupCheckError } = await supabase.rpc(
        "check_duplicate_contact",
        {
          p_email: formData.email.trim().toLowerCase(),
          p_phone: cleanedPhone,
        }
      );

      if (!dupCheckError && dupCheck) {
        if (dupCheck.phone_exists && !dupCheck.email_exists) {
          setErrorMsg("This WhatsApp number is already registered with another account. Please use a different number, or log in with the original email.");
          setLoading(false);
          return;
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone_number: cleanedPhone,
          }
        }
      });

      let userId = authData?.user?.id;

      if (authError) {
        const message = typeof authError === 'object' && authError !== null
          ? (authError.message || JSON.stringify(authError))
          : String(authError);

        const lowerMsg = message.toLowerCase();

        const isPhoneDuplicate =
          lowerMsg.includes("phone") && lowerMsg.includes("duplicate key value");
        const isEmailDuplicate =
          lowerMsg.includes("user already registered") ||
          lowerMsg.includes("already exists") ||
          (lowerMsg.includes("duplicate key value") && !isPhoneDuplicate) ||
          lowerMsg.includes("database error saving new user") ||
          lowerMsg.includes("unexpected_failure");

        if (isPhoneDuplicate) {
          setErrorMsg("This WhatsApp number is already registered with another account. Please use a different number, or log in with the original email.");
          setLoading(false);
          return;
        }

        if (isEmailDuplicate) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
          });

          if (signInError) {
            setErrorMsg("This email is registered. Please check your password or try a different email.");
            setLoading(false);
            return;
          }

          userId = signInData.user?.id;
        } else {
          setErrorMsg(message);
          setLoading(false);
          return;
        }
      }

      if (userId) {
        const { error: dbError } = await supabase
          .from("users")
          .upsert([
            {
              id: userId,
              phone_number: cleanedPhone,
              email: formData.email.trim().toLowerCase(),
              name: formData.name,
              nickname: formData.nickname || formData.name,
              country: formData.country,
              currency: formData.currency,
              language: resolvedLanguage,
              timezone: formData.timezone,
              plan: planParam.toUpperCase() === "FREE" ? "LITE" : planParam.toUpperCase(),
              payment_status: isFreePlan ? "PAID" : "PENDING",
              is_active: isFreePlan ? true : false,
            }
          ], { onConflict: "id" });

        if (dbError) {
          console.error("Database Insert Error:", dbError);
          if (dbError.code === "23505") {
            setErrorMsg("A user with this phone number or email already exists in the table.");
          } else {
            setErrorMsg("Failed to save user profile: " + dbError.message);
          }
          setLoading(false);
          return;
        }
      }

      handleRedirect(cleanedPhone);

    } catch (err: any) {
      console.error("Registration Error:", err);
      setErrorMsg(err?.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400"/>
        <span className="text-xs font-mono uppercase tracking-wider">Loading Broo.ai Form...</span>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-4xl p-6 md:p-10 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_0_rgba(0,0,0,0.8)] text-white">
      
      {/* Header Bar */}
      <div className="flex justify-between items-center pb-6 border-b border-white/10 mb-8">
        <Link className="flex items-center gap-2.5 font-bold text-xl tracking-tight hover:opacity-90 transition" href="/">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Bot className="w-5 h-5 text-white"/>
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Broo<span className="text-purple-400">.ai</span>
          </span>
        </Link>
        
        <div className="text-xs uppercase tracking-widest px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400"/>
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
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0"/>
              <span>Zero manual entry required</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0"/>
              <span>Instant AI receipt scanner & parser</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0"/>
              <span>Multi-currency real-time budgeting</span>
            </div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="lg:col-span-7">
          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3.5 rounded-xl text-xs mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400 shrink-0"/>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            
            {/* Row 1: Name & WhatsApp Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-purple-300 mb-1 font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400"/> Full Name *
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
                  <Phone className="w-3.5 h-3.5 text-emerald-400"/> WhatsApp Number *
                </label>
                <input
                  type="text"
                  name="phone_number"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+94771234567"
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>
            </div>

            {/* Row 2: Email & Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-purple-300 mb-1 font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-400"/> Email Address *
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
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400"/> Password *
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
                  <Globe className="w-3.5 h-3.5 text-pink-400"/> Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
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
                  <Smile className="w-3.5 h-3.5 text-amber-400"/> How to call you?
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
                  <Languages className="w-3.5 h-3.5 text-cyan-400"/> Preferred Language
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
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
                  <Coins className="w-3.5 h-3.5 text-emerald-400"/> Base Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
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

            {/* Row 5: Timezone */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-purple-300 mb-1 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400"/> Timezone
              </label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              >
                {WORLD_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value} className="bg-slate-900 text-white">
                    {tz.label}
                  </option>
                ))}
              </select>
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
              <label htmlFor="privacy" className="text-xs text-slate-400 cursor-pointer select-none">
                I agree to the <span className="text-purple-300 underline">Privacy Policy</span> & Terms.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/20 hover:opacity-90 transition transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950"/>
                  <span>CREATING ACCOUNT...</span>
                </>
              ) : planParam.toLowerCase() === "free" ? (
                <>
                  <span>START ON WHATSAPP 🚀</span>
                  <ArrowRight className="w-4 h-4"/>
                </>
              ) : (
                <>
                  <span>PROCEED TO PAYMENT 💳</span>
                  <ArrowRight className="w-4 h-4"/>
                </>
              )}
            </button>

            {/* Login Link Added Here */}
            <div className="text-center pt-3">
              <p className="text-xs text-slate-400">
                Already have an account?{" "}
                <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold underline transition">
                  Login here
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-8 pt-4 border-t border-white/5 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400"/>
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

      <Suspense fallback={
        <div className="flex items-center gap-2 text-white text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400"/>
          <span>Loading Broo.ai Form...</span>
        </div>
      }>
        <RegisterForm/>
      </Suspense>
    </main>
  );
}