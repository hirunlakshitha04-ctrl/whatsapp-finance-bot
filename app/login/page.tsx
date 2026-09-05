"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import { Phone, Lock, ArrowRight, Sparkles, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-200 selection:text-slate-900">

      {/* Top nav bar — same dark emerald gradient + link row as the landing
          page's nav, so the login page continues that bar seamlessly
          instead of switching to a plain light header. Links point back to
          the marketing page's sections since this page has none of its own;
          "Get Started" becomes "Register" and there's no separate Login
          link since we're already on it. */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-emerald-500 via-emerald-800 to-emerald-950 border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight shrink-0">
            <img src="/logo-icon.png" alt="BroFInAi logo" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-black text-white hidden sm:inline">
              Bro<span className="text-emerald-300">FInAi</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-white/80">
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/#language" className="hover:text-white transition-colors">Language</Link>
            <Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link href="/#contact" className="hover:text-white transition-colors">Contact</Link>
          </div>

          <Link
            href="/register"
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-xs bg-white text-slate-900 hover:bg-white/90 transition shadow-lg whitespace-nowrap"
          >
            Register
          </Link>
        </div>
      </nav>

      <div className="flex items-center justify-center p-4 relative overflow-hidden min-h-[calc(100vh-73px)]">

      {/* Background Glows — same restrained white/emerald bloom used on the
          landing page, instead of the previous dark emerald/cyan corner glows. */}
      <div className="absolute top-[-15%] right-[-10%] w-[560px] h-[560px] bg-emerald-100/60 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[10%] w-[520px] h-[520px] bg-emerald-500/10 rounded-full blur-[170px] pointer-events-none" />

      {/* Speech-bubble Card — rounded card with a small, fixed-size CSS tail
          (two stacked rotated squares: gradient border + white fill) instead
          of the pricing-card SVG mask. The mask stretched 100%/100%, so on
          a tall form it kept scaling the tail up with the card's height —
          a fixed-px tail stays the same size and position regardless. */}
      <div className="w-full max-w-md relative z-10">
        {/* Border layer */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[32px]"
          style={{ background: "linear-gradient(135deg, #34d399, #38bdf8)" }}
        />
        {/* Fill layer */}
        <div
          aria-hidden
          className="absolute inset-[2px] rounded-[30px] bg-white/90 backdrop-blur-2xl"
        />

        {/* Tail — fixed 26px notch, border square + inset fill square */}
        <div
          aria-hidden
          className="absolute w-[26px] h-[26px] rounded-[6px] rotate-45"
          style={{ right: "-11px", bottom: "72px", background: "linear-gradient(135deg, #34d399, #38bdf8)" }}
        />
        <div
          aria-hidden
          className="absolute w-[22px] h-[22px] rounded-[5px] rotate-45 bg-white"
          style={{ right: "-9px", bottom: "74px" }}
        />

        <div className="relative shadow-2xl shadow-emerald-900/[0.06] pl-8 pr-9 py-9 md:pl-10 md:pr-10 md:py-10 space-y-6">

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-2">
            <Sparkles size={12} /> Brofinai Portal
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Welcome Back 👋
          </h1>
          <p className="text-slate-600 text-sm">
            Sign in with your WhatsApp number or registered Email.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3.5 rounded-2xl">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">WhatsApp Phone / Email</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="+94711158910 or email@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-900/5 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-400 focus:bg-slate-900/[0.07] backdrop-blur-md transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-600">Password</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline transition"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/5 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-400 focus:bg-slate-900/[0.07] backdrop-blur-md transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-bold py-3.5 px-4 rounded-2xl transition duration-300 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Login to Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline transition">
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
    </div>
  );
}