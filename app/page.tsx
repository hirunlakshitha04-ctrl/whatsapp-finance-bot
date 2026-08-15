"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, Variants } from "framer-motion";
import { 
  Bot, 
  ArrowUpRight, 
  Zap, 
  ShieldCheck, 
  Receipt, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  PieChart,
  Check,
  X,
  Activity,
  Mail,
  Phone,
  Send
} from "lucide-react";

// Lucide dropped trademarked brand icons (Twitter/X, Instagram, LinkedIn, Facebook),
// so these are small local SVG replacements kept in the same stroke style.
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="0" />
    <path
      d="M18.9 3H21.7L15.3 10.3 22.8 21H16.9L12.3 14.7 7 21H4.2L11 13.2 3.8 3H9.9L14.1 8.8 18.9 3Z"
      fill="currentColor"
    />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.83v1.98h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.14V23h-4v-6.65c0-1.59-.03-3.63-2.21-3.63-2.22 0-2.56 1.73-2.56 3.52V23h-4V8.5z" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13.5 22v-8.4h2.8l.4-3.3h-3.2V8.1c0-.95.27-1.6 1.63-1.6H17V3.5C16.68 3.46 15.58 3.36 14.3 3.36c-2.6 0-4.4 1.6-4.4 4.53v2.4H7.1v3.3h2.8V22h3.6z" />
  </svg>
);

// Pricing Plans Data (Updated to include type=direct for automatic message flow)
const PRICING_PLANS = [
  {
    id: "free",
    name: "BRO LITE",
    price: "$0.00",
    period: "/ month",
    badge: "Free Forever",
    description: "Ideal for basic daily expense tracking on WhatsApp.",
    highlight: false,
    buttonText: "GET STARTED FREE",
    buttonClass: "bg-slate-800 hover:bg-slate-700 text-white border border-white/10",
    link: "/register?plan=free&type=direct",
    features: [
      { text: "3 Daily Expense & Income Logs", included: true },
      { text: "Real-time Web Dashboard Access", included: true },
      { text: "1 Daily AI Receipt OCR Scan", included: true },
      { text: "Voice Note Tracking", included: false },
      { text: "One-Click Excel (.xlsx) Export", included: false },
      { text: "Smart Budget Handling & Alerts", included: false },
    ],
  },
  {
    id: "core",
    name: "BRO CORE",
    price: "$2.55",
    period: "/ month",
    badge: "MOST POPULAR",
    description: "Ideal for active spenders & daily users.",
    highlight: true,
    buttonText: "UPGRADE TO BRO CORE",
    buttonClass: "bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black shadow-lg shadow-emerald-500/20",
    link: "/register?plan=core&type=direct",
    features: [
      { text: "10 Daily Expense & Income Logs", included: true },
      { text: "Real-time Web Dashboard Access", included: true },
      { text: "30 Monthly AI Receipt OCR Scans", included: true },
      { text: "5 Daily Voice Note Trackings", included: true },
      { text: "One-Click Excel (.xlsx) Export", included: true },
      { text: "Smart Budget Handling & Alerts", included: true },
    ],
  },
  {
    id: "max",
    name: "BRO MAX",
    price: "$5.99",
    period: "/ month",
    badge: "POWER USERS",
    description: "For freelancers, business owners & power users.",
    highlight: false,
    buttonText: "GET BRO MAX",
    buttonClass: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold shadow-lg shadow-purple-500/25",
    link: "/register?plan=max&type=direct",
    features: [
      { text: "Unlimited Daily Expense & Income Logs", included: true },
      { text: "Real-time Web Dashboard Access", included: true },
      { text: "Unlimited Monthly AI Receipt OCR Scans", included: true },
      { text: "Unlimited Voice Note Trackings", included: true },
      { text: "One-Click Excel (.xlsx) Export", included: true },
      { text: "Smart Budget Handling & Alerts", included: true },
    ],
  },
];

export default function BroFInAiLandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const { scrollYProgress } = useScroll();

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.98]);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Hook this up to your API route / email service of choice
    setContactSent(true);
    setContactForm({ name: "", email: "", message: "" });
    setTimeout(() => setContactSent(false), 4000);
  };

  // Smooth Scroll Helper
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.7, ease: [0.215, 0.610, 0.355, 1.000] } 
    }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white selection:bg-purple-500 selection:text-white font-sans overflow-x-hidden relative pb-28">
      
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 z-[100] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Ambient Lights */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="fixed top-[35%] right-[-10%] w-[650px] h-[650px] bg-pink-600/15 rounded-full blur-[190px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[20%] w-[550px] h-[550px] bg-emerald-600/15 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/70 border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Bro<span className="text-purple-400">FInAi</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" onClick={(e) => scrollToSection(e, "features")} className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" onClick={(e) => scrollToSection(e, "how-it-works")} className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, "pricing")} className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, "faq")} className="hover:text-white transition-colors">FAQ</a>
            <a href="#contact" onClick={(e) => scrollToSection(e, "contact")} className="hover:text-white transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link href="/login" className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition whitespace-nowrap">
              Login
            </Link>
            <Link
              href="/register?plan=free&type=direct"
              className="group relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-xs bg-white text-slate-950 hover:bg-slate-200 transition shadow-lg shadow-white/10 flex items-center gap-1.5 overflow-hidden whitespace-nowrap"
            >
              <span>Get Started</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <motion.section 
        style={{ opacity, scale }}
        className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
      >
        <motion.div 
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          className="lg:col-span-6 space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/15 backdrop-blur-md text-xs font-semibold text-purple-300 shadow-xl shadow-purple-500/10">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Official Launch: Live Now</span>
          </div>

          <h1 className="text-5xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[1.08]">
            Master Your Expenses Right Inside{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              WhatsApp
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-lg font-normal leading-relaxed">
            Zero complex apps. Log unlimited expenses via WhatsApp text or auto-scan receipt photos with AI. Instant real-time dashboard tracking.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/register?plan=free&type=direct"
              className="px-8 py-4 rounded-full font-bold text-sm bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2 group"
            >
              <span>Start Free Forever 🚀</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> Unlimited Free Text Logging
            </span>
          </div>
        </motion.div>

        {/* Dynamic WhatsApp Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="lg:col-span-6 relative flex justify-center"
        >
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80 animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80 animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 animate-pulse" />
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Activity className="w-3 h-3 animate-spin text-emerald-400" />
                BroFInAi Bot Live
              </span>
            </div>

            <div className="space-y-3 font-sans text-xs sm:text-sm pt-2">
              <div className="bg-emerald-600/30 border border-emerald-500/30 text-emerald-100 p-3 rounded-2xl rounded-tr-none max-w-[85%] ml-auto shadow-md">
                Spent $45.50 on Coffee & Breakfast ☕
              </div>
              <div className="bg-slate-800/90 border border-white/10 text-slate-200 p-4 rounded-2xl rounded-tl-none max-w-[90%] space-y-2 shadow-lg">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> Expense Logged!
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1 text-xs">
                  <div className="bg-white/5 p-2 rounded-lg">💵 Amount: <b className="text-white">$45.50</b></div>
                  <div className="bg-white/5 p-2 rounded-lg">🏷️ Category: <b className="text-white">Dining</b></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* FEATURES SECTION */}
      <section id="features" className="scroll-mt-24">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto px-6 py-28 border-t border-white/5"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-purple-400">Core Features</div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Everything You Need to Save More</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div variants={fadeInUp} className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-emerald-500/50 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl mb-3">💬 Unlimited Chat Logging</h3>
              <p className="text-slate-400 text-sm leading-relaxed">No daily limits! Send standard WhatsApp messages anytime to log expenses naturally.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-purple-500/50 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl mb-3">🧾 AI Receipt OCR Scanner</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Snap photos of receipts. Smart AI extracts merchant name, date, and exact amounts automatically.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/50 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl mb-3">📊 Dashboard & Excel Export</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Real-time sync with full web dashboard access and one-click structured Excel file downloads.</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-24">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-6 py-28 border-t border-white/5"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">Step-by-Step</div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">How It Works</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div variants={fadeInUp} className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 font-black flex items-center justify-center text-xl">1</div>
              <h3 className="text-xl font-bold">Connect WhatsApp Number</h3>
              <p className="text-slate-400 text-sm">Register your WhatsApp phone number to instantly link your account.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-xl">2</div>
              <h3 className="text-xl font-bold">Text or Send Receipt Photo</h3>
              <p className="text-slate-400 text-sm">Send a quick message like "Spent $15 for Groceries" or upload receipt photos.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-xl">3</div>
              <h3 className="text-xl font-bold">Instant Web Sync</h3>
              <p className="text-slate-400 text-sm">Watch real-time visual charts update and export full financial reports easily.</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="scroll-mt-24">
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto px-6 py-28 border-t border-white/5"
        >
          <div className="text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Flexible Plans
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
              Pick the perfect plan for your budgeting and tracking needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
                  plan.highlight
                    ? "bg-slate-900/90 border-2 border-emerald-400/80 shadow-[0_0_40px_0_rgba(52,211,153,0.15)] scale-[1.02]"
                    : "bg-slate-900/50 border border-white/10 hover:border-white/20"
                }`}
              >
                {/* Highlight Badge */}
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-400 text-slate-950 font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3" />
                    {plan.badge}
                  </div>
                )}

                <div>
                  {/* Header */}
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      {plan.name}
                    </span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl md:text-5xl font-black tracking-tight text-white">
                        {plan.price}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {plan.period}
                      </span>
                    </div>
                    {!plan.highlight && (
                      <p className="text-[11px] text-purple-300 font-medium mt-1">
                        {plan.badge}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="w-full h-[1px] bg-white/10 my-6" />

                  {/* Features List */}
                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-xs">
                        {feat.included ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <span className={feat.included ? "text-slate-200" : "text-slate-500 line-through"}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <Link
                  href={plan.link}
                  className={`w-full py-3.5 px-4 rounded-xl text-center text-xs tracking-wider uppercase font-bold transition flex items-center justify-center gap-2 cursor-pointer ${plan.buttonClass}`}
                >
                  <span>{plan.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted payment processing via LemonSqueezy. Cancel anytime.</span>
          </div>
        </motion.div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="scroll-mt-24 max-w-4xl mx-auto px-6 py-28 border-t border-white/5">
        <div className="text-center mb-16 space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan-400">FAQ</div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Is Bro Lite really free forever?",
              a: "Yes! Bro Lite is 100% free forever. You get 3 daily transactions and 1 daily AI receipt scan at zero cost."
            },
            {
              q: "How does AI Receipt Scanning work?",
              a: "Simply snap a photo of any bill or purchase receipt and send it to our WhatsApp bot. AI automatically extracts store names, dates, and final bill amounts into your dashboard."
            },
            {
              q: "Can I upgrade or cancel my subscription anytime?",
              a: "Absolute freedom! You can upgrade from Lite to Core ($2.55/mo) or Max ($5.99/mo) anytime directly through your billing portal with zero long-term commitments."
            }
          ].map((item, index) => (
            <div key={index} className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden">
              <button 
                onClick={() => toggleFaq(index)}
                className="w-full p-6 text-left flex justify-between items-center font-bold text-sm sm:text-base hover:text-purple-300 transition"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${activeFaq === index ? "rotate-180 text-purple-400" : "text-slate-500"}`} />
              </button>
              
              <AnimatePresence>
                {activeFaq === index && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4"
                  >
                    {item.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="relative p-12 rounded-3xl bg-gradient-to-r from-purple-900/60 via-slate-900 to-emerald-900/60 border border-white/20 text-center space-y-8 overflow-hidden shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight max-w-2xl mx-auto">
            Ready to Master Your Finances Globally?
          </h2>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Join thousands of smart spenders tracking expenses directly inside WhatsApp.
          </p>
          <Link
            href="/register?plan=free&type=direct"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-bold text-sm bg-white text-slate-950 hover:bg-slate-200 transition shadow-2xl shadow-white/20"
          >
            <span>Start Tracking Free 🚀</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* CONTACT US SECTION */}
      <section id="contact" className="scroll-mt-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-7xl mx-auto px-6 py-28 border-t border-white/5"
        >
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-pink-400">Get In Touch</div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">We'd Love to Hear From You</h2>
            <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
              Questions, feedback, or partnership ideas — our team usually replies within 24 hours.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-start">
            {/* Contact Info Cards */}
            <motion.div variants={fadeInUp} className="lg:col-span-4 space-y-4">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-emerald-500/50 transition-all flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Email Us</h3>
                  <a href="mailto:support@brofinai.com" className="text-slate-400 text-xs hover:text-emerald-300 transition-colors">support@brofinai.com</a>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-purple-500/50 transition-all flex items-start gap-4">
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">WhatsApp Support</h3>
                  <span className="text-slate-400 text-xs">+94 729 367 157</span>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div variants={fadeInUp} className="lg:col-span-8">
              <form
                onSubmit={handleContactSubmit}
                className="p-6 md:p-8 rounded-3xl bg-slate-900/50 border border-white/10 backdrop-blur-xl space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/60 focus:bg-white/[0.07] transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/60 focus:bg-white/[0.07] transition"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us what's on your mind..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/60 focus:bg-white/[0.07] transition resize-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <AnimatePresence>
                    {contactSent && (
                      <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Message sent — we'll be in touch!
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <button
                    type="submit"
                    className="ml-auto px-8 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 shadow-xl shadow-emerald-500/25 flex items-center gap-2 group transition-transform hover:scale-[1.02]"
                  >
                    <span>Send Message</span>
                    <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            {/* Brand Column */}
            <div className="md:col-span-5 space-y-5">
              <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight w-fit">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Bro<span className="text-purple-400">FInAi</span>
                </span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Track every expense right inside WhatsApp. No new apps, no spreadsheets — just message, snap, and go.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition">
                  <TwitterIcon className="w-4 h-4" />
                </a>
                <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition">
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition">
                  <LinkedinIcon className="w-4 h-4" />
                </a>
                <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition">
                  <FacebookIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">Product</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#features" onClick={(e) => scrollToSection(e, "features")} className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" onClick={(e) => scrollToSection(e, "how-it-works")} className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#pricing" onClick={(e) => scrollToSection(e, "pricing")} className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" onClick={(e) => scrollToSection(e, "faq")} className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="md:col-span-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">© {new Date().getFullYear()} BroFInAi. All rights reserved.</span>
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Bank-grade encryption on every message
            </span>
          </div>
        </div>
      </footer>

      {/* FLOATING STICKY DOCK */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-3xl">
        <div className="p-3 sm:p-4 rounded-full bg-slate-950/80 backdrop-blur-2xl border border-white/20 shadow-2xl flex items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs sm:text-sm font-semibold text-slate-200">
              Free WhatsApp Expense Tracker
            </span>
          </div>

          <Link 
            href="/register?plan=free&type=direct" 
            className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 whitespace-nowrap"
          >
            <span>Get Started</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}