"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { 
  Wallet, TrendingUp, TrendingDown, Search, RefreshCw, 
  PieChart as PieIcon, Calendar, RotateCcw,
  Sparkles, LogOut, User, KeyRound, Settings, LayoutDashboard,
  Download, MessageSquare, MessageCircle, Bell, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, Edit2, Check, X, Lock, ShieldCheck, Zap
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

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

export default function BrooDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "settings">("overview");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<string>("Rs.");
  const [nickname, setNickname] = useState<string>("Bro");
  const [userPhone, setUserPhone] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const router = useRouter();

  // 💳 SUBSCRIPTION PLANS ("lite" | "core" | "max")
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("lite");
  const [dailyTxCount, setDailyTxCount] = useState<number>(0);
  const [dailyOcrCount, setDailyOcrCount] = useState<number>(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all");

  // ✏️ EDIT TRANSACTION STATES
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [saveLoading, setSaveLoading] = useState(false);

  // 📅 Recent Transactions Custom Date Range States
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // ⚙️ Settings States
  const [profileName, setProfileName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Preference Toggles
  const [dailyReport, setDailyReport] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [autoOcrConfirm, setAutoOcrConfirm] = useState(false);

  // Password Update States
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    setUserEmail(session.user.email || "");

    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("email", session.user.email)
      .maybeSingle();

    let phoneToUse = userData?.phone_number?.trim() || "";

    if (userData) {
      setCurrency(userData.base_currency || "Rs.");
      const displayName = userData.how_to_call_you || userData.name || "Bro";
      setNickname(displayName);
      setProfileName(displayName);
      setUserPhone(phoneToUse);

      // 💳 FETCH SUBSCRIPTION PLAN & DAILY USAGE
      const plan = (userData.plan || "lite").toLowerCase();
      setSubscriptionPlan(plan);
      setDailyTxCount(userData.daily_tx_count || 0);
      setDailyOcrCount(userData.daily_ocr_count || 0);
    }

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
    const channel = supabase
      .channel("realtime-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ✏️ START EDITING A TRANSACTION
  const handleStartEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditItem(tx.item || "");
    setEditCategory(tx.category || "Other");
    setEditAmount(tx.amount.toString());
    setEditType(tx.type || "expense");
  };

  // ✏️ CANCEL EDITING
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  // 💾 SAVE EDITED TRANSACTION TO SUPABASE
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    try {
      const { error } = await supabase
        .from("users")
        .update({ 
          how_to_call_you: profileName,
          base_currency: currency
        })
        .eq("email", userEmail);

      if (error) throw error;

      setNickname(profileName);
      setProfileMsg({ type: "success", text: "Settings successfully saved!" });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
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

    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordMsg({ type: "success", text: "Password updated successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setPasswordLoading(false);
    }
  };

  // 🧮 OVERALL STATS CALCULATIONS (Current Month Only)
  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions.filter(t => {
      if (!t.created_at) return false;
      const txDate = new Date(t.created_at);
      return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
    });
  }, [transactions]);

  const totalIncome = useMemo(() => 
    currentMonthTransactions.filter(t => t.type === "income").reduce((acc, t) => acc + Number(t.amount || 0), 0),
  [currentMonthTransactions]);

  const totalExpense = useMemo(() => 
    currentMonthTransactions.filter(t => t.type === "expense").reduce((acc, t) => acc + Number(t.amount || 0), 0),
  [currentMonthTransactions]);

  const accountBalance = totalIncome - totalExpense;

  // 📊 Current Month Category Expense
  const categoryExpenses = useMemo(() => {
    const map: { [key: string]: number } = {};

    currentMonthTransactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        const cat = t.category || "Other";
        map[cat] = (map[cat] || 0) + Number(t.amount || 0);
      });

    return map;
  }, [currentMonthTransactions]);

  const pieChartData = useMemo(() => {
    return Object.keys(categoryExpenses).map(cat => ({ name: cat, value: categoryExpenses[cat] }));
  }, [categoryExpenses]);

  // 🔍 TRANSACTIONS TABLE FILTER
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

  // 📊 EXCEL EXPORT
  const handleExportExcel = () => {
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
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 sm:p-6 md:p-10 relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/30 border border-slate-700/50 p-6 md:p-8 rounded-[36px] backdrop-blur-3xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl text-emerald-400 font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
              ⚡ Broo.ai
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1 uppercase">
                  <Sparkles size={10} /> Broo {subscriptionPlan.toUpperCase()} Plan
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
                  User: <strong className="text-white">{nickname}</strong>
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-white">Smart Finance Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="bg-slate-800/60 hover:bg-slate-700/60 text-slate-200 px-4 py-2.5 rounded-2xl border border-slate-700/80 flex items-center gap-2 text-xs font-semibold backdrop-blur-xl transition">
              <RefreshCw size={14} className={loading ? "animate-spin text-emerald-400" : ""} /> Sync
            </button>
            <button onClick={handleLogout} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition backdrop-blur-xl">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {/* 💳 SUBSCRIPTION PLAN DYNAMIC BANNER */}
        {subscriptionPlan === "lite" && (
          <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <h4 className="text-xs font-bold text-amber-300">
                  Broo Lite Active ({dailyTxCount}/3 Daily Transactions | {dailyOcrCount}/1 Daily Scan)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Upgrade to Broo Core or Max for more daily logs & voice notes tracking!
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push("/#pricing")} 
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold px-4 py-2 rounded-xl transition whitespace-nowrap shadow-md shadow-amber-500/20"
            >
              Upgrade to Core / Max 🚀
            </button>
          </div>
        )}

        {subscriptionPlan === "core" && (
          <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent border border-emerald-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-400" size={20} />
              <div>
                <h4 className="text-xs font-bold text-emerald-300">
                  Broo Core Active ({dailyTxCount}/10 Daily Transactions | 30 Scans/Month)
                </h4>
                <p className="text-[11px] text-slate-400">Upgrade to Broo Max for Unlimited Transactions, Voice Notes & Receipt Scans!</p>
              </div>
            </div>
            <button 
              onClick={() => router.push("/#pricing")} 
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-extrabold px-4 py-2 rounded-xl transition whitespace-nowrap shadow-md shadow-emerald-500/20"
            >
              Get Broo Max 👑
            </button>
          </div>
        )}

        {subscriptionPlan === "max" && (
          <div className="bg-gradient-to-r from-purple-500/20 via-indigo-500/10 to-transparent border border-purple-500/30 p-4 rounded-2xl flex items-center justify-between backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Zap className="text-purple-400" size={20} />
              <div>
                <h4 className="text-xs font-bold text-purple-300">Broo Max Unlimited Active 👑</h4>
                <p className="text-[11px] text-slate-400">You have unlimited Transactions, Voice Notes, and Receipt Scans + Auto Save!</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 backdrop-blur-xl ${
              activeTab === "overview"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 border border-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-slate-900/60"
            }`}
          >
            <LayoutDashboard size={16} /> Overview
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-6 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 backdrop-blur-xl ${
              activeTab === "settings"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 border border-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-slate-900/60"
            }`}
          >
            <Settings size={16} /> General Settings
          </button>
        </div>

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            
            {/* 3 EQUAL STAT CARDS (Current Month Summary) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-[30px] backdrop-blur-3xl relative overflow-hidden group hover:border-slate-700 transition">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  🏦 THIS MONTH BALANCE
                </span>
                <h2 className={`text-2xl sm:text-3xl font-black mt-3 ${accountBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currency} {accountBalance.toFixed(2)}
                </h2>
                <p className="text-[11px] text-slate-500 mt-2">Net remaining for this month</p>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-[30px] backdrop-blur-3xl relative overflow-hidden group hover:border-slate-700 transition">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  📈 THIS MONTH INCOME
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-cyan-400 mt-3">
                  + {currency} {totalIncome.toFixed(2)}
                </h2>
                <p className="text-[11px] text-slate-500 mt-2">Earnings logged this month</p>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-[30px] backdrop-blur-3xl relative overflow-hidden group hover:border-slate-700 transition">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  📉 THIS MONTH EXPENSE
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-rose-400 mt-3">
                  - {currency} {totalExpense.toFixed(2)}
                </h2>
                <p className="text-[11px] text-slate-500 mt-2">Spending logged this month</p>
              </div>

            </div>

            {/* Donut Chart & WhatsApp Connector */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-[32px] lg:col-span-2 backdrop-blur-3xl flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <PieIcon size={18} className="text-emerald-400" /> Current Month Breakdown
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
                                stroke="#030712" 
                                strokeWidth={2} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(val: any) => `${currency} ${Number(val).toFixed(2)}`} 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {pieChartData.map((item) => {
                        const percentage = totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(1) : "0.0";
                        const catColor = CATEGORY_COLORS[item.name] || "#64748B";

                        return (
                          <div key={item.name} className="flex items-center justify-between text-xs bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
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
                  <div className="text-center py-20 text-slate-500 text-xs">No expenses logged for this month</div>
                )}
              </div>

              <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-[32px] backdrop-blur-3xl flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2 mb-2">
                    <MessageCircle size={18} className="text-emerald-400" /> Quick WhatsApp Connector
                  </h3>
                  <p className="text-slate-400 text-xs mb-6">Scan or tap to open WhatsApp bot directly.</p>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center gap-3">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://wa.me/${userPhone.replace(/\D/g, "")}`} 
                      alt="WhatsApp QR Code" 
                      className="w-32 h-32 rounded-xl border border-slate-800 bg-white p-2"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">Linked: {userPhone || "Not set"}</span>
                  </div>
                </div>

                <a 
                  href={`https://wa.me/${userPhone.replace(/\D/g, "")}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-3 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                >
                  <MessageSquare size={16} /> Open Bot Button
                </a>
              </div>
            </div>

            {/* Transactions Table Section with Edit Feature */}
            <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-[32px] space-y-6 backdrop-blur-3xl">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div>
                  <h3 className="font-extrabold text-lg text-white">Recent Transactions</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Edit, filter transactions by date range or search terms</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl">
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
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition"
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
                    className="bg-slate-950/80 border border-slate-800 text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                  />

                  <button 
                    onClick={handleExportExcel}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition whitespace-nowrap shadow-md shadow-emerald-500/10"
                  >
                    <Download size={14} /> Export Excel 📊
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Merchant / Note</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((tx) => {
                        const isEditing = editingId === tx.id;

                        return (
                          <tr key={tx.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                              {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "Today"}
                            </td>

                            {/* ITEM / DESCRIPTION */}
                            <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  value={editItem} 
                                  onChange={(e) => setEditItem(e.target.value)} 
                                  className="bg-slate-950 border border-emerald-500 px-2 py-1 rounded-lg text-xs text-white focus:outline-none"
                                />
                              ) : (
                                tx.item
                              )}
                            </td>

                            {/* CATEGORY */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isEditing ? (
                                <select 
                                  value={editCategory} 
                                  onChange={(e) => setEditCategory(e.target.value)}
                                  className="bg-slate-950 border border-emerald-500 px-2 py-1 rounded-lg text-xs text-white focus:outline-none"
                                >
                                  {CATEGORY_OPTIONS.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg font-semibold text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700/60">
                                  {tx.category || "Other"}
                                </span>
                              )}
                            </td>

                            {/* AMOUNT */}
                            <td className="py-3.5 px-4 font-extrabold whitespace-nowrap">
                              {isEditing ? (
                                <input 
                                  type="number" 
                                  value={editAmount} 
                                  onChange={(e) => setEditAmount(e.target.value)} 
                                  className="bg-slate-950 border border-emerald-500 px-2 py-1 rounded-lg text-xs text-white w-24 focus:outline-none"
                                />
                              ) : (
                                <span className={tx.type === "income" ? "text-emerald-400" : "text-slate-200"}>
                                  {currency} {Number(tx.amount || 0).toFixed(2)}
                                </span>
                              )}
                            </td>

                            {/* TYPE */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isEditing ? (
                                <select 
                                  value={editType} 
                                  onChange={(e) => setEditType(e.target.value as "income" | "expense")}
                                  className="bg-slate-950 border border-emerald-500 px-2 py-1 rounded-lg text-xs text-white focus:outline-none"
                                >
                                  <option value="expense">Expense</option>
                                  <option value="income">Income</option>
                                </select>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  tx.type === "income" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}>
                                  {tx.type}
                                </span>
                              )}
                            </td>

                            {/* ENTRY TYPE / METHOD */}
                            <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap uppercase text-[10px] font-mono">
                              {tx.entry_type || "text"}
                            </td>

                            {/* ACTION BUTTONS */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button 
                                    onClick={() => handleSaveEdit(tx.id)} 
                                    disabled={saveLoading}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-1.5 rounded-lg transition"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button 
                                    onClick={handleCancelEdit} 
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg transition"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleStartEdit(tx)} 
                                  className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg transition"
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

        {/* TAB 2: GENERAL SETTINGS */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Profile Settings */}
            <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-[32px] backdrop-blur-3xl space-y-5">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <User size={18} className="text-emerald-400" /> Profile & Currency
              </h3>

              {profileMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  profileMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                }`}>
                  {profileMsg.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">How Should Broo Call You?</label>
                  <input 
                    type="text" 
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">Preferred Currency</label>
                  <select 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="Rs.">LKR (Rs.)</option>
                    <option value="$">USD ($)</option>
                    <option value="€">EUR (€)</option>
                    <option value="£">GBP (£)</option>
                    <option value="₹">INR (₹)</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={profileLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {profileLoading ? <RefreshCw size={14} className="animate-spin" /> : "Save Profile Settings"}
                </button>
              </form>
            </div>

            {/* Password Update */}
            <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-[32px] backdrop-blur-3xl space-y-5">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <KeyRound size={18} className="text-emerald-400" /> Security Settings
              </h3>

              {passwordMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                }`}>
                  {passwordMsg.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/80 border border-slate-800 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">Confirm Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/80 border border-slate-800 text-xs text-slate-100 p-3 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={passwordLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {passwordLoading ? <RefreshCw size={14} className="animate-spin" /> : "Update Password"}
                </button>
              </form>
            </div>

            {/* Feature Access & Preferences Control (Membership-Based Toggles) */}
            <div className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-[32px] backdrop-blur-3xl space-y-5 md:col-span-2">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Bell size={18} className="text-emerald-400" /> Plan Features & Preferences
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Daily Summary */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Daily WhatsApp Report</h4>
                    <p className="text-[10px] text-slate-500">Get evening spending alerts</p>
                  </div>
                  <button onClick={() => setDailyReport(!dailyReport)} className="text-emerald-400">
                    {dailyReport ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-slate-600" />}
                  </button>
                </div>

                {/* Budget Alerts */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Budget Warning Alerts</h4>
                    <p className="text-[10px] text-slate-500">Notify when balance is low</p>
                  </div>
                  <button onClick={() => setBudgetAlerts(!budgetAlerts)} className="text-emerald-400">
                    {budgetAlerts ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-slate-600" />}
                  </button>
                </div>

                {/* Auto Confirm OCR (Broo Max Feature) */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  subscriptionPlan !== "max" ? "bg-slate-950/20 border-slate-900 opacity-60" : "bg-slate-950/60 border-slate-800/80"
                }`}>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      Auto Confirm OCR {subscriptionPlan !== "max" && <Lock size={12} className="text-amber-400" />}
                    </h4>
                    <p className="text-[10px] text-slate-500">Auto-save receipt extractions</p>
                  </div>
                  {subscriptionPlan !== "max" ? (
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md font-bold">Max</span>
                  ) : (
                    <button onClick={() => setAutoOcrConfirm(!autoOcrConfirm)} className="text-emerald-400">
                      {autoOcrConfirm ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-slate-600" />}
                    </button>
                  )}
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}