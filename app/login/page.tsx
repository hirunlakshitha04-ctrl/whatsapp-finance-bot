"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import {
  Phone,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  DollarSign,
  Wallet,
  Coins,
  TrendingUp,
  Receipt,
  CreditCard,
  PieChart,
} from "lucide-react";

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

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // Phone or Email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    let cleanInput = identifier.trim();

    try {
      let targetEmail = cleanInput;

      // Input එක Email එකක් නොවේ නම් (Phone Number එකක් නම්)
      if (!cleanInput.includes("@")) {
        const purePhone = cleanInput.replace(/[^0-9+]/g, "");
        const formattedPhone = purePhone.startsWith("+") ? purePhone : `+94${purePhone.replace(/^0/, "")}`;

        const { data: user, error: userError } = await supabase
          .from("users")
          .select("email")
          .or(`phone_number.eq.${purePhone},phone_number.eq.${formattedPhone}`)
          .single();

        if (userError || !user) {
          setErrorMsg("Phone number not registered.");
          setLoading(false);
          return;
        }
        targetEmail = user.email;
      }

      // Supabase Auth Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      if (error) {
        setErrorMsg("Invalid Credentials. Please try again.");
      } else if (data.session) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-black">
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Falling finance-tracker icons drifting down the background.
          Rendered with no explicit z-index (same as the glows above),
          so it stays below the logo/card which are both z-10. */}
      <FallingIcons />

      {/* Site Logo — same mark used in the header/footer of the marketing site */}
      <Link href="/" className="absolute top-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5 font-bold text-xl tracking-tight w-fit">
        <img src="/logo-icon.png" alt="BroFInAi logo" className="w-9 h-9 object-contain" />
        <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Bro<span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">FInAi</span>
        </span>
      </Link>

      {/* Speech-bubble Card — rounded card with a small, fixed-size CSS tail
          (two stacked rotated squares: gradient border + dark fill) instead
          of the pricing-card SVG mask. The mask stretched 100%/100%, so on
          a tall form it kept scaling the tail up with the card's height —
          a fixed-px tail stays the same size and position regardless. */}
      <div className="w-full max-w-md relative z-10 mt-16">
        {/* Border layer */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[32px]"
          style={{ background: "linear-gradient(135deg, #34d399, #38bdf8)" }}
        />
        {/* Fill layer */}
        <div
          aria-hidden
          className="absolute inset-[2px] rounded-[30px] bg-slate-900/70 backdrop-blur-2xl"
        />

        {/* Tail — fixed 26px notch, border square + inset fill square */}
        <div
          aria-hidden
          className="absolute w-[26px] h-[26px] rounded-[6px] rotate-45"
          style={{ right: "-11px", bottom: "72px", background: "linear-gradient(135deg, #34d399, #38bdf8)" }}
        />
        <div
          aria-hidden
          className="absolute w-[22px] h-[22px] rounded-[5px] rotate-45 bg-slate-900"
          style={{ right: "-9px", bottom: "74px" }}
        />

        <div className="relative shadow-2xl pl-8 pr-9 py-9 md:pl-10 md:pr-10 md:py-10 space-y-6">

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-2">
            <Sparkles size={12} /> Brofinai Portal
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Welcome Back 👋
          </h1>
          <p className="text-slate-400 text-sm">
            Sign in with your WhatsApp number or registered Email.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3.5 rounded-2xl">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">WhatsApp Phone / Email</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                placeholder="+94711158910 or email@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 text-sm text-slate-200 pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500/50 backdrop-blur-md transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-emerald-400 hover:underline transition"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 text-sm text-slate-200 pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500/50 backdrop-blur-md transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold py-3.5 px-4 rounded-2xl transition duration-300 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Login to Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-emerald-400 font-semibold hover:underline transition">
            Register
          </Link>
        </p>

        </div>
      </div>

      {/* Forgot Password Popup Modal Component */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        initialInput={identifier}
      />

    </div>
  );
}