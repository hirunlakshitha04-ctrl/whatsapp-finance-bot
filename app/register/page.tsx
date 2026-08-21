"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
  DollarSign,
  Wallet,
  TrendingUp,
  Receipt,
  CreditCard,
  PieChart
} from "lucide-react";

// Supabase Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Falling finance-icon background — dollar signs, wallets, coins etc. drop in
// inside circular badges and settle at a spot spread across the FULL height
// of the screen (not just the bottom), each on its own staggered delay and
// cycle length. After holding, each one fades out and falls back in again,
// so it's a continuous, ongoing effect that keeps the whole background
// gradually filling and refilling rather than a one-shot landing. Presets
// are hardcoded (not Math.random) so the server-rendered and
// client-hydrated markup match exactly.
const FALLING_ICON_SET = [DollarSign, Wallet, Coins, TrendingUp, Receipt, CreditCard, PieChart];

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
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {FALLING_ICON_PRESETS.map((p, i) => {
        const Icon = FALLING_ICON_SET[p.icon];
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: `${p.left}%`, top: "-14%" }}
            initial={{ y: "-10vh", opacity: 0, scale: 0.4 }}
            animate={{
              y: ["-10vh", p.landY, p.landY, "-10vh"],
              opacity: [0, 1, 1, 0],
              scale: [0.4, 1, 1, 0.4],
            }}
            transition={{
              duration: p.cycleDuration,
              delay: p.delay,
              repeat: Infinity,
              times: [0, 0.18, 0.82, 1], // quick fall in, long hold, quick fade out
              ease: [0.34, 1.56, 0.64, 1], // slight overshoot on landing
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

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Setup: (options: { eventHandler: (event: { event?: string }) => void }) => void;
      Url: { Open: (url: string) => void };
    };
  }
}

const WORLD_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso",
  "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic",
  "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Republic of the)", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor (Timor-Leste)",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini",
  "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
  "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
  "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Ivory Coast (Côte d'Ivoire)", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Laos", "Latvia", "Lebanon",
  "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macau",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
  "Montenegro", "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia",
  "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan",
  "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia",
  "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
  "Afghanistan": "Asia/Kabul",
  "Albania": "Europe/Tirane",
  "Algeria": "Africa/Algiers",
  "Andorra": "Europe/Andorra",
  "Angola": "Africa/Luanda",
  "Antigua and Barbuda": "America/Antigua",
  "Argentina": "America/Argentina/Buenos_Aires",
  "Armenia": "Asia/Yerevan",
  "Australia": "Australia/Sydney",
  "Austria": "Europe/Vienna",
  "Azerbaijan": "Asia/Baku",
  "Bahamas": "America/Nassau",
  "Bahrain": "Asia/Bahrain",
  "Bangladesh": "Asia/Dhaka",
  "Barbados": "America/Barbados",
  "Belarus": "Europe/Minsk",
  "Belgium": "Europe/Brussels",
  "Belize": "America/Belize",
  "Benin": "Africa/Porto-Novo",
  "Bhutan": "Asia/Thimphu",
  "Bolivia": "America/La_Paz",
  "Bosnia and Herzegovina": "Europe/Sarajevo",
  "Botswana": "Africa/Gaborone",
  "Brazil": "America/Sao_Paulo",
  "Brunei": "Asia/Brunei",
  "Bulgaria": "Europe/Sofia",
  "Burkina Faso": "Africa/Ouagadougou",
  "Burundi": "Africa/Bujumbura",
  "Cabo Verde": "Atlantic/Cape_Verde",
  "Cambodia": "Asia/Phnom_Penh",
  "Cameroon": "Africa/Douala",
  "Canada": "America/Toronto",
  "Central African Republic": "Africa/Bangui",
  "Chad": "Africa/Ndjamena",
  "Chile": "America/Santiago",
  "China": "Asia/Shanghai",
  "Colombia": "America/Bogota",
  "Comoros": "Indian/Comoro",
  "Congo (Republic of the)": "Africa/Brazzaville",
  "Costa Rica": "America/Costa_Rica",
  "Croatia": "Europe/Zagreb",
  "Cuba": "America/Havana",
  "Cyprus": "Asia/Nicosia",
  "Czech Republic": "Europe/Prague",
  "Democratic Republic of the Congo": "Africa/Kinshasa",
  "Denmark": "Europe/Copenhagen",
  "Djibouti": "Africa/Djibouti",
  "Dominica": "America/Dominica",
  "Dominican Republic": "America/Santo_Domingo",
  "East Timor (Timor-Leste)": "Asia/Dili",
  "Ecuador": "America/Guayaquil",
  "Egypt": "Africa/Cairo",
  "El Salvador": "America/El_Salvador",
  "Equatorial Guinea": "Africa/Malabo",
  "Eritrea": "Africa/Asmara",
  "Estonia": "Europe/Tallinn",
  "Eswatini": "Africa/Mbabane",
  "Ethiopia": "Africa/Addis_Ababa",
  "Fiji": "Pacific/Fiji",
  "Finland": "Europe/Helsinki",
  "France": "Europe/Paris",
  "Gabon": "Africa/Libreville",
  "Gambia": "Africa/Banjul",
  "Georgia": "Asia/Tbilisi",
  "Germany": "Europe/Berlin",
  "Ghana": "Africa/Accra",
  "Greece": "Europe/Athens",
  "Grenada": "America/Grenada",
  "Guatemala": "America/Guatemala",
  "Guinea": "Africa/Conakry",
  "Guinea-Bissau": "Africa/Bissau",
  "Guyana": "America/Guyana",
  "Haiti": "America/Port-au-Prince",
  "Honduras": "America/Tegucigalpa",
  "Hong Kong": "Asia/Hong_Kong",
  "Hungary": "Europe/Budapest",
  "Iceland": "Atlantic/Reykjavik",
  "India": "Asia/Kolkata",
  "Indonesia": "Asia/Jakarta",
  "Iran": "Asia/Tehran",
  "Iraq": "Asia/Baghdad",
  "Ireland": "Europe/Dublin",
  "Israel": "Asia/Jerusalem",
  "Italy": "Europe/Rome",
  "Ivory Coast (Côte d'Ivoire)": "Africa/Abidjan",
  "Jamaica": "America/Jamaica",
  "Japan": "Asia/Tokyo",
  "Jordan": "Asia/Amman",
  "Kazakhstan": "Asia/Almaty",
  "Kenya": "Africa/Nairobi",
  "Kiribati": "Pacific/Tarawa",
  "Kosovo": "Europe/Belgrade",
  "Kuwait": "Asia/Kuwait",
  "Laos": "Asia/Vientiane",
  "Latvia": "Europe/Riga",
  "Lebanon": "Asia/Beirut",
  "Lesotho": "Africa/Maseru",
  "Liberia": "Africa/Monrovia",
  "Libya": "Africa/Tripoli",
  "Liechtenstein": "Europe/Vaduz",
  "Lithuania": "Europe/Vilnius",
  "Luxembourg": "Europe/Luxembourg",
  "Macau": "Asia/Macau",
  "Madagascar": "Indian/Antananarivo",
  "Malawi": "Africa/Blantyre",
  "Malaysia": "Asia/Kuala_Lumpur",
  "Maldives": "Indian/Maldives",
  "Mali": "Africa/Bamako",
  "Malta": "Europe/Malta",
  "Marshall Islands": "Pacific/Majuro",
  "Mauritania": "Africa/Nouakchott",
  "Mauritius": "Indian/Mauritius",
  "Mexico": "America/Mexico_City",
  "Micronesia": "Pacific/Chuuk",
  "Moldova": "Europe/Chisinau",
  "Monaco": "Europe/Monaco",
  "Mongolia": "Asia/Ulaanbaatar",
  "Montenegro": "Europe/Podgorica",
  "Morocco": "Africa/Casablanca",
  "Mozambique": "Africa/Maputo",
  "Myanmar (Burma)": "Asia/Yangon",
  "Namibia": "Africa/Windhoek",
  "Nauru": "Pacific/Nauru",
  "Nepal": "Asia/Kathmandu",
  "Netherlands": "Europe/Amsterdam",
  "New Zealand": "Pacific/Auckland",
  "Nicaragua": "America/Managua",
  "Niger": "Africa/Lagos",
  "Nigeria": "Africa/Lagos",
  "North Korea": "Asia/Pyongyang",
  "North Macedonia": "Europe/Skopje",
  "Norway": "Europe/Oslo",
  "Oman": "Asia/Muscat",
  "Pakistan": "Asia/Karachi",
  "Palau": "Pacific/Palau",
  "Palestine": "Asia/Gaza",
  "Panama": "America/Panama",
  "Papua New Guinea": "Pacific/Port_Moresby",
  "Paraguay": "America/Asuncion",
  "Peru": "America/Lima",
  "Philippines": "Asia/Manila",
  "Poland": "Europe/Warsaw",
  "Portugal": "Europe/Lisbon",
  "Puerto Rico": "America/Puerto_Rico",
  "Qatar": "Asia/Qatar",
  "Romania": "Europe/Bucharest",
  "Russia": "Europe/Moscow",
  "Rwanda": "Africa/Kigali",
  "Saint Kitts and Nevis": "America/St_Kitts",
  "Saint Lucia": "America/St_Lucia",
  "Saint Vincent and the Grenadines": "America/St_Vincent",
  "Samoa": "Pacific/Apia",
  "San Marino": "Europe/San_Marino",
  "Sao Tome and Principe": "Africa/Sao_Tome",
  "Saudi Arabia": "Asia/Riyadh",
  "Senegal": "Africa/Dakar",
  "Serbia": "Europe/Belgrade",
  "Seychelles": "Indian/Mahe",
  "Sierra Leone": "Africa/Freetown",
  "Singapore": "Asia/Singapore",
  "Slovakia": "Europe/Bratislava",
  "Slovenia": "Europe/Ljubljana",
  "Solomon Islands": "Pacific/Guadalcanal",
  "Somalia": "Africa/Mogadishu",
  "South Africa": "Africa/Johannesburg",
  "South Korea": "Asia/Seoul",
  "South Sudan": "Africa/Juba",
  "Spain": "Europe/Madrid",
  "Sri Lanka": "Asia/Colombo",
  "Sudan": "Africa/Khartoum",
  "Suriname": "America/Paramaribo",
  "Sweden": "Europe/Stockholm",
  "Switzerland": "Europe/Zurich",
  "Syria": "Asia/Damascus",
  "Taiwan": "Asia/Taipei",
  "Tajikistan": "Asia/Dushanbe",
  "Tanzania": "Africa/Dar_es_Salaam",
  "Thailand": "Asia/Bangkok",
  "Togo": "Africa/Lome",
  "Tonga": "Pacific/Tongatapu",
  "Trinidad and Tobago": "America/Port_of_Spain",
  "Tunisia": "Africa/Tunis",
  "Turkey": "Europe/Istanbul",
  "Turkmenistan": "Asia/Ashgabat",
  "Tuvalu": "Pacific/Funafuti",
  "Uganda": "Africa/Kampala",
  "Ukraine": "Europe/Kyiv",
  "United Arab Emirates": "Asia/Dubai",
  "United Kingdom": "Europe/London",
  "United States": "America/New_York",
  "Uruguay": "America/Montevideo",
  "Uzbekistan": "Asia/Tashkent",
  "Vanuatu": "Pacific/Efate",
  "Vatican City": "Europe/Vatican",
  "Venezuela": "America/Caracas",
  "Vietnam": "Asia/Ho_Chi_Minh",
  "Yemen": "Asia/Aden",
  "Zambia": "Africa/Lusaka",
  "Zimbabwe": "Africa/Harare"
};

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

const LANGUAGE_NAME_MAP: Record<string, string> = {
  af: "Afrikaans",
  sq: "Albanian",
  am: "Amharic",
  ar: "Arabic",
  hy: "Armenian",
  az: "Azerbaijani",
  bn: "Bengali",
  bs: "Bosnian",
  bg: "Bulgarian",
  my: "Burmese",
  zh: "Chinese",
  hr: "Croatian",
  cs: "Czech",
  da: "Danish",
  nl: "Dutch",
  en: "English",
  et: "Estonian",
  tl: "Filipino",
  fi: "Finnish",
  fr: "French",
  ka: "Georgian",
  de: "German",
  el: "Greek",
  gu: "Gujarati",
  ha: "Hausa",
  he: "Hebrew",
  hi: "Hindi",
  hu: "Hungarian",
  is: "Icelandic",
  ig: "Igbo",
  id: "Indonesian",
  ga: "Irish",
  it: "Italian",
  ja: "Japanese",
  kn: "Kannada",
  kk: "Kazakh",
  km: "Khmer",
  ko: "Korean",
  ku: "Kurdish",
  lo: "Lao",
  lv: "Latvian",
  lt: "Lithuanian",
  mk: "Macedonian",
  ms: "Malay",
  ml: "Malayalam",
  mr: "Marathi",
  mn: "Mongolian",
  ne: "Nepali",
  no: "Norwegian",
  ps: "Pashto",
  fa: "Persian",
  pl: "Polish",
  pt: "Portuguese",
  pa: "Punjabi",
  ro: "Romanian",
  ru: "Russian",
  sr: "Serbian",
  sd: "Sindhi",
  singlish: "Singlish",
  si: "Sinhala",
  sk: "Slovak",
  sl: "Slovenian",
  so: "Somali",
  es: "Spanish",
  sw: "Swahili",
  sv: "Swedish",
  ta: "Tamil",
  te: "Telugu",
  th: "Thai",
  tr: "Turkish",
  uk: "Ukrainian",
  ur: "Urdu",
  uz: "Uzbek",
  vi: "Vietnamese",
  cy: "Welsh",
  xh: "Xhosa",
  yo: "Yoruba",
  zu: "Zulu"
};

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

function RegisterForm() {
  const [isMounted, setIsMounted] = useState(false);
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") || "free";
  // Channel chosen on the pricing page carries through via ?channel=...
  // so the register page can pre-select it instead of asking again.
  const channelParam = searchParams.get("channel");
  const hasChannelParam = channelParam === "whatsapp" || channelParam === "telegram";
  const initialChannel = (hasChannelParam ? channelParam : "whatsapp") as "whatsapp" | "telegram";

  // Compact confirmation chip is shown when we already know the channel
  // (came from pricing page); full toggle shows only if they tap "Switch
  // channel" or if there was no channel param to begin with.
  const [showChannelToggle, setShowChannelToggle] = useState(!hasChannelParam);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone_number: "",
    channel: initialChannel,
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
    // Timezone is derived automatically from the selected country (no user prompt needed).
    const initialTz = COUNTRY_TIMEZONE_MAP[formData.country];
    if (initialTz) {
      setFormData((prev) => ({ ...prev, timezone: initialTz }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load Lemon Squeezy overlay script once, up front, so it's ready by the
  // time the user finishes filling the form and hits submit. We rely on the
  // Checkout.Success event to redirect (NOT the redirect_url query param,
  // which Lemon Squeezy does not reliably honour on static buy links) —
  // this is what guarantees type=direct/phone/plan survive to the WhatsApp
  // auto-message step.
  const lemonReady = React.useRef(false);
  const lemonSuccessUrlRef = React.useRef<string>("");

  useEffect(() => {
    if (document.querySelector('script[src="https://app.lemonsqueezy.com/js/checkout.js"]')) {
      if (window.LemonSqueezy) lemonReady.current = true;
      return;
    }
    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/checkout.js";
    script.async = true;
    script.onload = () => {
      // IMPORTANT: Lemon Squeezy's docs require calling window.createLemonSqueezy()
      // yourself in SPA/React apps — the script does NOT auto-initialize
      // window.LemonSqueezy on its own here. Without this call, window.LemonSqueezy
      // stays undefined forever and every checkout silently falls back to a
      // plain full-page redirect (which is what was happening before).
      if (typeof window.createLemonSqueezy === "function") {
        window.createLemonSqueezy();
      }
      if (window.LemonSqueezy) {
        window.LemonSqueezy.Setup({
          eventHandler: (event) => {
            if (event.event === "Checkout.Success" && lemonSuccessUrlRef.current) {
              window.location.href = lemonSuccessUrlRef.current;
            }
          },
        });
        lemonReady.current = true;
      }
    };
    document.body.appendChild(script);
  }, []);

  const handleChannelSelect = (channel: "whatsapp" | "telegram") => {
    setFormData((prev) => ({ ...prev, channel }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else if (name === "country") {
      // Auto-update timezone in the background whenever the country changes.
      const autoTz = COUNTRY_TIMEZONE_MAP[value] || formData.timezone;
      setFormData({ ...formData, country: value, timezone: autoTz });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRedirect = (cleanedPhone: string, linkToken: string) => {
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const currentPlan = (urlParams?.get("plan") || planParam || "free").toLowerCase().trim();

    if (currentPlan === "free" || currentPlan === "lite") {
      if (formData.channel === "telegram") {
        // Telegram has no phone number to match on, so the chat_id is only
        // discoverable once the user hits /start — the link_token embedded
        // here is how telegram/route.ts resolves that first message back to
        // this exact user row.
        const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "your_bot_username";
        window.location.href = `https://t.me/${botUsername}?start=${linkToken}`;
        return;
      }
      const botPhoneNumber = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || "+94764775963";
      const cleanNumber = botPhoneNumber.replace("whatsapp:", "").replace("+", "");
      const defaultText = encodeURIComponent("Hi BroFinAi, I just registered on the Free plan!");
      window.location.href = `https://wa.me/${cleanNumber}?text=${defaultText}`;
      return;
    }

    // Ask our server route to create the checkout via Lemon Squeezy's official
    // Checkout API. This is the ONLY way redirect_url + custom phone data are
    // guaranteed to be honoured — building the buy-link URL by hand with query
    // params (the old approach) is not reliably respected by Lemon Squeezy.
    handleRedirectAsync(currentPlan, cleanedPhone, linkToken);
  };

  const handleRedirectAsync = async (currentPlan: string, cleanedPhone: string, linkToken: string) => {
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: currentPlan,
          phone: cleanedPhone,
          email: formData.email,
          name: formData.name,
          channel: formData.channel,
          link_token: linkToken,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        console.error("Checkout API error:", data);
        setErrorMsg(
          data?.error
            ? `Could not start checkout: ${data.error}`
            : "Could not start checkout. Please try again in a moment."
        );
        return;
      }

      const checkoutUrl: string = data.url;
      // Lets the Checkout.Success event handler auto-redirect immediately
      // when the overlay is used, instead of waiting for the user to click
      // the confirmation button.
      lemonSuccessUrlRef.current = data.redirectUrl || "";

      // Overlay is a nice-to-have here (keeps the user on-site) — but since
      // the server already guarantees redirect_url is correct, the plain
      // full-page fallback is now just as reliable, not a risk anymore.
      if (lemonReady.current && window.LemonSqueezy) {
        window.LemonSqueezy.Url.Open(checkoutUrl);
      } else {
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      console.error("Checkout start failed:", err);
      setErrorMsg("Could not start checkout. Please try again in a moment.");
    }
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

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (formData.channel === "whatsapp" && !formData.phone_number.trim()) {
      setErrorMsg("Please enter a valid WhatsApp phone number.");
      setLoading(false);
      return;
    }

    // Phone number sanitization — only relevant for the WhatsApp channel.
    // Telegram users are identified later by chat_id (via link_token), so
    // there's nothing to collect or clean here.
    let cleanedPhone = "";
    if (formData.channel === "whatsapp") {
      cleanedPhone = formData.phone_number.trim().replace(/[^0-9+]/g, "");
      if (cleanedPhone.startsWith("0")) {
        cleanedPhone = "+94" + cleanedPhone.slice(1);
      } else if (!cleanedPhone.startsWith("+")) {
        cleanedPhone = `+${cleanedPhone}`;
      }
    }

    // One-time token used only to link a Telegram chat_id back to this user
    // row on their first /start message — see telegram/route.ts. Generated
    // here as a fallback; reused-vs-fresh decision happens once we know the
    // user id (see below) so retries don't invalidate a link already sent.
    const generateLinkToken = () =>
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const resolvedLanguage = LANGUAGE_NAME_MAP[formData.language] || "English";
    const isFreePlan = planParam.toLowerCase() === "free" || planParam.toLowerCase() === "lite";

    try {
      const { data: dupCheck, error: dupCheckError } = await supabase.rpc(
        "check_duplicate_contact",
        {
          p_email: formData.email.trim().toLowerCase(),
          p_phone: formData.channel === "whatsapp" ? cleanedPhone : null,
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
            phone_number: cleanedPhone || null,
          }
        }
      });

      let userId = authData?.user?.id;
      let linkToken = generateLinkToken();

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

          const existingUserId = signInData.user?.id;

          // One account, one channel. Check whether this row has already
          // committed to a channel (phone_number set = WhatsApp, or
          // telegram_chat_id set = Telegram already linked) — if so, block
          // switching to a different channel on this same email so users
          // don't end up half-linked to two channels on one account.
          const { data: existingChannelRow } = await supabase
            .from("users")
            .select("phone_number, telegram_chat_id")
            .eq("id", existingUserId)
            .maybeSingle();

          const existingChannel: "whatsapp" | "telegram" | null = existingChannelRow?.telegram_chat_id
            ? "telegram"
            : existingChannelRow?.phone_number
            ? "whatsapp"
            : null;

          if (existingChannel && existingChannel !== formData.channel) {
            const existingLabel = existingChannel === "whatsapp" ? "WhatsApp" : "Telegram";
            const requestedLabel = formData.channel === "whatsapp" ? "WhatsApp" : "Telegram";
            setErrorMsg(
              `This email is already registered on ${existingLabel}. An account can only be linked to one channel — continue on ${existingLabel}, or use a different email to register on ${requestedLabel}.`
            );
            setLoading(false);
            return;
          }

          userId = existingUserId;
        } else {
          setErrorMsg(message);
          setLoading(false);
          return;
        }
      }

      if (userId) {
        // If this user already has a pending (not-yet-linked) token from an
        // earlier attempt — e.g. a prior submit whose checkout failed —
        // reuse it instead of overwriting it. Otherwise any Telegram
        // "Start on Telegram" link they already opened (or a Lemon Squeezy
        // checkout tab left open with the old token baked into its
        // redirect_url) would report "Link Invalid or Expired" once this
        // upsert replaces link_token with a new value.
        if (formData.channel === "telegram") {
          const { data: existingRow } = await supabase
            .from("users")
            .select("link_token, telegram_chat_id")
            .eq("id", userId)
            .maybeSingle();

          if (existingRow?.link_token && !existingRow.telegram_chat_id) {
            linkToken = existingRow.link_token;
          }
        }

        const { error: dbError } = await supabase
          .from("users")
          .upsert([
            {
              id: userId,
              phone_number: cleanedPhone || null,
              link_token: linkToken,
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
              // 7-day WhatsApp trial: only free/Lite signups on WhatsApp get a
              // trial_ends_at — this is what app/api/whatsapp/route.ts checks
              // to block messages once the trial's over, and what the
              // reminder cron uses for day 1/4/6 nudges. Telegram is
              // permanently free (no trial), and paid plans don't need one.
              trial_ends_at:
                isFreePlan && formData.channel === "whatsapp"
                  ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                  : null,
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

      handleRedirect(cleanedPhone, linkToken);

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
        <span className="text-xs font-mono uppercase tracking-wider">Loading BroFinAi Form...</span>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-5xl text-white">

      {/* Header Bar — sits above both speech-bubble panels */}
      <div className="flex justify-between items-center pb-6 mb-8 md:mb-10">
        <Link className="flex items-center gap-2.5 font-bold text-xl tracking-tight hover:opacity-90 transition" href="/">
          <img src="/logo-icon.png" alt="BroFInAi logo" className="w-9 h-9 object-contain" />
          <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Bro<span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">FInAi</span>
          </span>
        </Link>
        
        <div className="text-xs uppercase tracking-widest px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400"/>
          {planParam} Plan
        </div>
      </div>

      {/* Main Content Layout — left info panel and right form panel are each
          their own speech-bubble shape (gradient border + fixed-size tail),
          tails pointing at each other like two sides of a chat. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-stretch">
        
        {/* Left Side Info — bubble panel, tail points right toward the form */}
        <div className="lg:col-span-5 relative">
          <div
            aria-hidden
            className="absolute inset-0 rounded-[28px]"
            style={{ background: "linear-gradient(135deg, #a855f7, #38bdf8)" }}
          />
          <div
            aria-hidden
            className="absolute inset-[2px] rounded-[26px] bg-slate-900/80 backdrop-blur-2xl"
          />
          <div
            aria-hidden
            className="hidden lg:block absolute w-[24px] h-[24px] rounded-[6px] rotate-45"
            style={{ right: "-10px", top: "50%", marginTop: "-12px", background: "linear-gradient(135deg, #a855f7, #38bdf8)" }}
          />
          <div
            aria-hidden
            className="hidden lg:block absolute w-[20px] h-[20px] rounded-[5px] rotate-45 bg-slate-900"
            style={{ right: "-8px", top: "50%", marginTop: "-10px" }}
          />

          <div className="relative p-6 md:p-8 h-full flex flex-col">
          <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
            Stop Money <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Disappearing.
            </span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Connect your personal profile, select your local currency & language, and let <b>BroFinAi</b> track every expense seamlessly on WhatsApp.
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

          {/* Filler — mini chat preview showing the product in action, pinned
              to the bottom so the panel doesn't sit half-empty next to the
              taller form panel. */}
          <div className="mt-auto pt-10">
            <div className="space-y-2.5">
              <div className="flex justify-end">
                <div className="bg-emerald-500/15 border border-emerald-400/20 text-emerald-100 text-xs rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[85%]">
                  Spent $12.50 on lunch 🍔
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 text-slate-200 text-xs rounded-2xl rounded-bl-sm px-3.5 py-2 max-w-[85%]">
                  Logged ✅ Food & Dining — Balance: $487.50
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-6 mt-6 border-t border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Bank-grade encryption on every message you send</span>
            </div>
          </div>
          </div>
        </div>

        {/* Right Side Form — bubble panel, tail points left toward the info panel */}
        <div className="lg:col-span-7 relative">
          <div
            aria-hidden
            className="absolute inset-0 rounded-[28px]"
            style={{ background: "linear-gradient(135deg, #38bdf8, #a855f7)" }}
          />
          <div
            aria-hidden
            className="absolute inset-[2px] rounded-[26px] bg-slate-900/80 backdrop-blur-2xl"
          />
          <div
            aria-hidden
            className="hidden lg:block absolute w-[24px] h-[24px] rounded-[6px] rotate-45"
            style={{ left: "-10px", top: "50%", marginTop: "-12px", background: "linear-gradient(135deg, #38bdf8, #a855f7)" }}
          />
          <div
            aria-hidden
            className="hidden lg:block absolute w-[20px] h-[20px] rounded-[5px] rotate-45 bg-slate-900"
            style={{ left: "-8px", top: "50%", marginTop: "-10px" }}
          />

          <div className="relative p-6 md:p-8">
          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3.5 rounded-xl text-xs mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400 shrink-0"/>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">

            {/* Row 0: Channel Selector */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-purple-300 mb-1.5 font-medium flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-emerald-400"/> Where do you want to chat with BroFinAi? *
              </label>
              {showChannelToggle ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChannelSelect("whatsapp")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-sm font-semibold border transition ${
                      formData.channel === "whatsapp"
                        ? "bg-emerald-500/15 border-emerald-400 text-emerald-300"
                        : "bg-slate-950/70 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <Phone className="w-4 h-4"/> WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChannelSelect("telegram")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-sm font-semibold border transition ${
                      formData.channel === "telegram"
                        ? "bg-sky-500/15 border-sky-400 text-sky-300"
                        : "bg-slate-950/70 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <Bot className="w-4 h-4"/> Telegram
                  </button>
                </div>
              ) : (
                <div
                  className={`flex items-center justify-between gap-3 py-2.5 px-3.5 rounded-xl border text-sm font-semibold ${
                    formData.channel === "whatsapp"
                      ? "bg-emerald-500/15 border-emerald-400 text-emerald-300"
                      : "bg-sky-500/15 border-sky-400 text-sky-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {formData.channel === "whatsapp" ? (
                      <Phone className="w-4 h-4"/>
                    ) : (
                      <Bot className="w-4 h-4"/>
                    )}
                    Registering via {formData.channel === "whatsapp" ? "WhatsApp" : "Telegram"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowChannelToggle(true)}
                    className="text-[11px] font-medium text-slate-400 hover:text-white underline underline-offset-2 transition"
                  >
                    Switch channel
                  </button>
                </div>
              )}
            </div>

            {/* Row 1: Name & (WhatsApp Phone — only when WhatsApp is selected) */}
            <div className={`grid grid-cols-1 ${formData.channel === "whatsapp" ? "md:grid-cols-2" : ""} gap-3.5`}>
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

              {formData.channel === "whatsapp" && (
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
              )}
            </div>

            {formData.channel === "telegram" && (
              <p className="text-xs text-sky-300/80 bg-sky-500/10 border border-sky-500/20 rounded-xl px-3.5 py-2.5">
                No phone number needed — after you submit, we'll open Telegram and link your account automatically.
              </p>
            )}

            {/* Row 2: Password & Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-purple-300 mb-1 font-medium flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400"/> Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
              </div>
            </div>

            {/* Row 2b: Email */}
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
                I agree to the{" "}
                <Link href="/privacy-policy" className="text-purple-300 underline hover:text-purple-200">
                  Privacy Policy
                </Link>{" "}
                &{" "}
                <Link href="/terms-of-service" className="text-purple-300 underline hover:text-purple-200">
                  Terms
                </Link>
                .
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
                  <span>{formData.channel === "telegram" ? "START ON TELEGRAM 🚀" : "START ON WHATSAPP 🚀"}</span>
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
      </div>

      {/* Footer Note */}
      <div className="mt-8 pt-4 border-t border-white/5 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400"/>
        <span>End-to-End Encrypted Data Security by BroFinAi</span>
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

      {/* Falling finance-tracker icons drifting down the background */}
      <FallingIcons />

      <Suspense fallback={
        <div className="flex items-center gap-2 text-white text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400"/>
          <span>Loading BroFinAi Form...</span>
        </div>
      }>
        <RegisterForm/>
      </Suspense>
    </main>
  );
}