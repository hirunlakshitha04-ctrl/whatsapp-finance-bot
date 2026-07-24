"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart as PieChartIcon,
  RefreshCw
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from "recharts";

interface Transaction {
  id: string;
  type: "income" | "expense";
  item: string;
  category: string;
  amount: number;
  currency: string;
  created_at: string;
}

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6366F1"];

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("LKR");

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    
    // Get Current User (Supabase Auth)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch User Settings (Budget & Currency)
    const { data: userData } = await supabase
      .from("users")
      .select("monthly_budget, base_currency, phone_number")
      .eq("email", user.email)
      .single();

    if (userData) {
      setMonthlyBudget(userData.monthly_budget || 0);
      setCurrency(userData.base_currency || "LKR");

      // Fetch User Transactions using Phone Number
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("phone_number", userData.phone_number)
        .order("created_at", { ascending: false });

      if (txData) setTransactions(txData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // 🚀 REAL-TIME LISTENERS (Auto refresh on WhatsApp entry)
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          fetchData(); // Sync live data instantly
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Financial Calculations
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const currentBalance = totalIncome - totalExpense;

  // Chart Data Preparation (Expense per category)
  const categoryDataMap: { [key: string]: number } = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryDataMap[t.category] = (categoryDataMap[t.category] || 0) + Number(t.amount);
    });

  const chartData = Object.keys(categoryDataMap).map((cat) => ({
    name: cat,
    value: categoryDataMap[cat],
  }));

  const budgetProgress = monthlyBudget > 0 ? Math.min((totalExpense / monthlyBudget) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
            Broo.ai Dashboard 🚀
          </h1>
          <p className="text-slate-400 text-sm">Real-time WhatsApp Expense Sync</p>
        </div>
        <button 
          onClick={fetchData} 
          className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition text-slate-300"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Total Balance */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-400 text-sm font-medium">Total Balance</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Wallet size={20} />
            </div>
          </div>
          <h2 className="text-2xl font-bold">{currency} {currentBalance.toLocaleString()}</h2>
        </div>

        {/* Total Income */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-400 text-sm font-medium">Total Income</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-cyan-400">
            + {currency} {totalIncome.toLocaleString()}
          </h2>
        </div>

        {/* Total Expense */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-400 text-sm font-medium">Total Expenses</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <TrendingDown size={20} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-rose-400">
            - {currency} {totalExpense.toLocaleString()}
          </h2>
        </div>

        {/* Monthly Budget */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm font-medium">Monthly Budget</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Target size={20} />
            </div>
          </div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xl font-bold">{currency} {monthlyBudget.toLocaleString()}</span>
            <span className="text-xs text-slate-400">{budgetProgress.toFixed(0)}% used</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${budgetProgress > 90 ? 'bg-rose-500' : 'bg-amber-400'}`}
              style={{ width: `${budgetProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Category Analytics Chart */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl lg:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon size={20} className="text-emerald-400" />
            <h3 className="font-semibold text-lg">Expense Breakdown</h3>
          </div>
          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "12px" }} 
                    formatter={(value: any) => `${currency} ${Number(value).toLocaleString()}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              වියදම් කිසිවක් සටහන් වී නැත.
            </div>
          )}
        </div>

        {/* Live Transactions Feed */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg">Live Transactions</h3>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              • Live Syncing
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="flex justify-between items-center p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-xl hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-slate-200">{tx.item}</h4>
                      <p className="text-xs text-slate-500">{tx.category} • {new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {tx.type === 'income' ? '+' : '-'} {tx.currency} {Number(tx.amount).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-10 text-sm">තවම Transactions නැත.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}