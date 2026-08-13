"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { 
  Wallet, TrendingUp, TrendingDown, RefreshCw, 
  PieChart as PieIcon, Calendar, RotateCcw,
  Sparkles, LogOut, Settings, LayoutDashboard,
  Download, CheckCircle2, AlertCircle, Edit2, Check, X, Lock, ShieldCheck, Zap, BarChart3, Filter, Ban,
  User, Mail, Phone, Camera, Globe
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

const CATEGORY_COLORS: { [key: string]: string } = {
  Food: "#F59E0B", Groceries: "#10B981", Transport: "#3B82F6", Bills: "#EF4444", 
  Shopping: "#EC4899", Entertainment: "#8B5CF6", Medical: "#06B6D4",
  Salary: "#10B981", "Starting Balance": "#6366F1", Other: "#64748B"
};

const CATEGORY_OPTIONS = [
  "Food", "Groceries", "Transport", "Bills", 
  "Shopping", "Entertainment", "Medical", "Salary", "Other"
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

export default function BrooDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "settings">("overview");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<string>("Rs.");
  const [nickname, setNickname] = useState<string>("Bro");
  const [userPhone, setUserPhone] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>(AVATAR_OPTIONS[0]);
  const router = useRouter();

  const [appLanguage, setAppLanguage] = useState<string>("en");
  const [dateFormat, setDateFormat] = useState<string>("DD/MM/YYYY");
  const [weekStart, setWeekStart] = useState<string>("Monday");

  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("lite");

  // 🎯 BUDGET STATES LOADED FROM SUPABASE
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [categoryBudgets, setCategoryBudgets] = useState<{ [key: string]: number }>({});
  const [isEditingBudget, setIsEditingBudget] = useState<boolean>(false);
  const [tempBudget, setTempBudget] = useState<string>("0");
  const [tempCatBudgets, setTempCatBudgets] = useState<{ [key: string]: string }>({});

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const todayDate = now.toISOString().slice(0, 10);

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
  const [saveLoading, setSaveLoading] = useState(false);

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
      await fetch('https://your-whatsapp-bot-api.com/send-message', {
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

    // Fetch user profile & budget data from Supabase using upsert/maybeSingle safety to avoid 422/PGRST116 errors
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("email", session.user.email)
      .maybeSingle();

    let phoneToUse = userData?.phone_number?.trim() || "";

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
    }

    // 🎯 1. Fetch Budgets safely
    let budgetQuery = supabase.from("budgets").select("*");
    if (phoneToUse) {
      budgetQuery = budgetQuery.eq("phone_number", phoneToUse);
    }
    const { data: budgetData } = await budgetQuery;

    if (budgetData && budgetData.length > 0) {
      const catMap: { [key: string]: number } = {};
      let totalB = 0;
      budgetData.forEach((b: any) => {
        const amt = Number(b.amount_limit || 0);
        catMap[b.category] = amt;
        totalB += amt;
      });

      setMonthlyBudget(totalB);
      setTempBudget(totalB.toString());
      setCategoryBudgets(catMap);
      
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

    // Fetch transactions safely
    const { data: txData } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (txData && phoneToUse) {
      const cleanPhone = phoneToUse.replace(/\D/g, "").slice(-9);
      const filtered = txData.filter(t => {
        if (!t.phone_number) return false;
        return t.phone_number.replace(/\D/g, "").endsWith(cleanPhone);
      });
      setTransactions([...filtered]);
    } else if (txData) {
      setTransactions([...txData]);
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

  const handleSaveBudget = async () => {
    const val = Number(tempBudget);
    if (isNaN(val) || val < 0) return;

    const newCatBudgetsMap: { [key: string]: number } = {};
    Object.keys(tempCatBudgets).forEach(cat => {
      newCatBudgetsMap[cat] = Number(tempCatBudgets[cat]) || 0;
    });

    setMonthlyBudget(val);
    setCategoryBudgets(newCatBudgetsMap);
    setIsEditingBudget(false);

    try {
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

  const handleSaveEdit = async (id: string) => {
    if (!editItem.trim() || !editAmount || isNaN(Number(editAmount))) {
      alert("Please enter a valid description and amount.");
      return;
    }

    setSaveLoading(true);

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          item: editItem.trim(),
          category: editCategory,
          amount: Number(editAmount),
          type: editType
        })
        .eq("id", id);

      if (error) throw error;

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
      // Sends a 6-digit OTP code to the user's registered email (Supabase Auth email OTP)
      const { error } = await supabase.auth.signInWithOtp({
        email: userEmail,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;

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
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: otpCode.trim(),
        type: "email",
      });
      if (verifyError) throw verifyError;

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

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
      const { error } = await supabase.auth.signInWithOtp({
        email: userEmail,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
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

  const handleExportExcel = () => {
    if (subscriptionPlan === "lite") {
      alert("Excel export is available for Core & Max users only. Please upgrade!");
      return;
    }

    if (filteredTransactions.length === 0) return;

    const workbook = XLSX.utils.book_new();
    const monthGroups: { [key: string]: Transaction[] } = {};

    filteredTransactions.forEach(t => {
      const monthKey = t.created_at 
        ? new Date(t.created_at).toISOString().slice(0, 7) 
        : "Unknown_Month";

      if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
      monthGroups[monthKey].push(t);
    });

    Object.keys(monthGroups).sort().reverse().forEach((month) => {
      const monthTxList = monthGroups[month];
      const incomeList = monthTxList.filter(t => t.type === "income");
      const expenseList = monthTxList.filter(t => t.type === "expense");

      const monthIncome = incomeList.reduce((acc, t) => acc + Number(t.amount || 0), 0);
      const monthExpense = expenseList.reduce((acc, t) => acc + Number(t.amount || 0), 0);
      const monthBalance = monthIncome - monthExpense;

      const sheetData: any[][] = [
        ["MONTHLY SUMMARY", "", "", "", "", "REPORT DATE", new Date().toLocaleDateString()],
        ["Total Income", `${currency} ${monthIncome.toFixed(2)}`, "", "Total Expense", `${currency} ${monthExpense.toFixed(2)}`, "Net Balance", `${currency} ${monthBalance.toFixed(2)}`],
        [],
        ["INCOME TRANSACTIONS", "", "", "", "", "EXPENSE TRANSACTIONS", "", "", ""],
        ["Date", "Item / Description", "Category", "Amount", "", "Date", "Item / Description", "Category", "Amount"]
      ];

      const maxRows = Math.max(incomeList.length, expenseList.length);

      for (let i = 0; i < maxRows; i++) {
        const inc = incomeList[i];
        const exp = expenseList[i];

        sheetData.push([
          inc ? new Date(inc.created_at).toLocaleDateString() : "",
          inc ? inc.item : "",
          inc ? (inc.category || "General") : "",
          inc ? inc.amount : "",
          "", 
          exp ? new Date(exp.created_at).toLocaleDateString() : "",
          exp ? exp.item : "",
          exp ? (exp.category || "General") : "",
          exp ? exp.amount : ""
        ]);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      worksheet["!cols"] = [
        { wch: 12 }, { wch: 22 }, { wch: 15 }, { wch: 12 }, { wch: 5 },
        { wch: 12 }, { wch: 22 }, { wch: 15 }, { wch: 12 }  
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, `Month_${month}`);
    });

    XLSX.writeFile(workbook, `Broo_Financial_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 sm:p-6 md:p-10 relative overflow-hidden selection:bg-emerald-500 selection:text-slate-950">
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[650px] h-[650px] bg-emerald-500/15 rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-white/10 p-6 md:p-8 rounded-[36px] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={avatarUrl} 
                alt="Profile Avatar" 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/10"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-lg">
                <Zap size={10} className="fill-slate-950" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[11px] font-extrabold px-3 py-0.5 rounded-full border flex items-center gap-1.5 uppercase backdrop-blur-md shadow-sm ${
                  subscriptionPlan === "max" 
                    ? "bg-purple-500/20 border-purple-400/40 text-purple-300"
                    : subscriptionPlan === "core"
                    ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                    : "bg-amber-500/20 border-amber-400/40 text-amber-300"
                }`}>
                  <Sparkles size={11} /> {subscriptionPlan.toUpperCase()} PACKAGE
                </span>
                <span className="text-[10px] text-slate-300 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
                  User: <strong className="text-white">{nickname}</strong>
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">Smart Finance Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="bg-white/5 hover:bg-white/10 text-slate-200 px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-2 text-xs font-semibold backdrop-blur-md transition shadow-md">
              <RefreshCw size={14} className={loading ? "animate-spin text-emerald-400" : ""} /> Sync
            </button>
            <button onClick={handleLogout} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition backdrop-blur-md shadow-md">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/10 p-5 rounded-[28px] backdrop-blur-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl border backdrop-blur-md ${
              subscriptionPlan === "max" 
                ? "bg-purple-500/20 border-purple-400/30 text-purple-300" 
                : subscriptionPlan === "core" 
                ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300" 
                : "bg-amber-500/20 border-amber-400/30 text-amber-300"
            }`}>
              <Zap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Subscription Status: <span className="text-emerald-400">{subscriptionPlan.toUpperCase()} PLAN</span>
                </h4>
              </div>
              <p className="text-[11px] text-slate-300/80 mt-0.5">
                {subscriptionPlan === "lite" && "Upgrade to Core or Max to unlock Budget Chart and Excel Export."}
                {subscriptionPlan === "core" && "You have Core Access. Upgrade to Max for full AI features."}
                {subscriptionPlan === "max" && "You are on the highest plan! Enjoy full unlimited feature access."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {subscriptionPlan === "lite" && (
              <a
                href="/pricing"
                className="w-full md:w-auto bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 text-center"
              >
                <Zap size={14} className="fill-slate-950" /> Upgrade Plan 🚀
              </a>
            )}

            {subscriptionPlan === "core" && (
              <a
                href="/pricing?plan=max"
                className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 text-center"
              >
                <Sparkles size={14} /> Upgrade to Max 🚀
              </a>
            )}

            {subscriptionPlan === "max" && (
              <button
                disabled
                className="w-full md:w-auto bg-purple-500/20 border border-purple-400/30 text-purple-300 font-bold text-xs px-4 py-2.5 rounded-xl cursor-default flex items-center justify-center gap-2"
              >
                <Sparkles size={13} /> Max Plan Active
              </button>
            )}

            <a
              href="https://app.lemonsqueezy.com/my-orders"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-bold text-xs px-4 py-2.5 rounded-xl transition backdrop-blur-md flex items-center justify-center gap-2"
            >
              <Ban size={13} className="text-rose-400" /> Manage / Cancel Subscription
            </a>
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
                      <BarChart3 size={18} className="text-emerald-400" /> WhatsApp Budget & Remaining
                    </h3>

                    {subscriptionPlan !== "lite" && (
                      isEditingBudget ? (
                        <button onClick={handleSaveBudget} className="text-xs bg-emerald-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-lg shadow-md">
                          Save
                        </button>
                      ) : (
                        <button onClick={() => setIsEditingBudget(true)} className="text-xs text-slate-300 hover:text-emerald-400 flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-md transition">
                          <Edit2 size={12} /> Edit Targets
                        </button>
                      )
                    )}
                  </div>

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
                        href="/pricing"
                        className="w-full inline-block bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-black py-2.5 rounded-xl transition shadow-lg shadow-amber-500/10 text-center"
                      >
                        Upgrade Plan 🚀
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-2">
                      <p className="text-[11px] text-slate-400 mb-2">Track category spending sent via WhatsApp & check remaining balances:</p>
                      
                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {Object.keys(categoryBudgets).length > 0 ? (
                          Object.keys(categoryBudgets).map((cat) => {
                            const limit = categoryBudgets[cat] || 0;
                            const spent = categoryExpenses[cat] || 0;
                            const remaining = limit - spent;
                            const isOver = remaining < 0;

                            return (
                              <div key={cat} className="bg-black/40 border border-white/5 p-3 rounded-2xl backdrop-blur-md space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-200 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] || "#10B981" }} />
                                    {cat}
                                  </span>
                                  {isEditingBudget ? (
                                    <input 
                                      type="number"
                                      value={tempCatBudgets[cat] ?? limit}
                                      onChange={(e) => setTempCatBudgets({...tempCatBudgets, [cat]: e.target.value})}
                                      className="w-20 bg-slate-950 border border-emerald-500 text-xs text-white px-2 py-0.5 rounded-lg text-right"
                                    />
                                  ) : (
                                    <span className="text-[11px] text-slate-400 font-medium">
                                      Limit: <strong className="text-white">{currency} {limit.toFixed(2)}</strong>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400">Spent: <strong className="text-rose-400">{currency} {spent.toFixed(2)}</strong></span>
                                  <span className="text-slate-400">
                                    Remaining: <strong className={isOver ? "text-rose-400" : "text-emerald-400"}>{currency} {remaining.toFixed(2)}</strong>
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-10 text-slate-500 text-xs">No category budgets set</div>
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
                                <button 
                                  onClick={() => handleStartEdit(tx)} 
                                  className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition border border-white/10 backdrop-blur-md"
                                >
                                  <Edit2 size={13} />
                                </button>
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
                  <label className="text-xs text-slate-300 font-bold mb-2 flex items-center gap-1.5">
                    <Camera size={13} className="text-emerald-400" /> Profile Picture (Upload or Choose Avatar)
                  </label>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="relative">
                      <img 
                        src={selectedAvatar || avatarUrl} 
                        alt="Selected Profile" 
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
                      />
                      {uploadingImg && (
                        <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                          <RefreshCw size={16} className="animate-spin text-emerald-400" />
                        </div>
                      )}
                    </div>

                    <div>
                      <label 
                        htmlFor="custom-avatar-upload"
                        className="cursor-pointer bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/10 flex items-center gap-2 transition backdrop-blur-md"
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
                      <p className="text-[10px] text-slate-400 mt-1">JPG, PNG or WEBP (Max 2MB)</p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-semibold block mb-2">Or choose a preset avatar:</span>
                  <div className="flex items-center gap-3 overflow-x-auto py-1">
                    {AVATAR_OPTIONS.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedAvatar(imgUrl)}
                        className={`relative rounded-2xl p-1 transition border-2 flex-shrink-0 ${
                          selectedAvatar === imgUrl 
                            ? "border-emerald-400 bg-emerald-500/20 scale-105" 
                            : "border-transparent opacity-60 hover:opacity-100"
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
    </div>
  );
}