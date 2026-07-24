'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform, Variants } from 'framer-motion';
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
  Star,
  Activity,
  Rocket
} from 'lucide-react';

export default function BrooLandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();

  // Scroll Progress Transformations
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.98]);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // ✅ Fixed Animation Variants with explicit 'Variants' type
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
      
      {/* 🚀 Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 z-[100] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* 🔮 Dynamic Floating Ambient Light Orbs */}
      <motion.div 
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.25, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[170px] pointer-events-none -z-10" 
      />
      <motion.div 
        animate={{
          x: [0, -60, 0],
          y: [0, 40, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-[35%] right-[-10%] w-[650px] h-[650px] bg-pink-600/25 rounded-full blur-[190px] pointer-events-none -z-10" 
      />
      <motion.div 
        animate={{
          x: [0, 40, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="fixed bottom-[-10%] left-[20%] w-[550px] h-[550px] bg-cyan-600/20 rounded-full blur-[160px] pointer-events-none -z-10" 
      />

      {/* 🧭 Navigation Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/70 border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Broo<span className="text-purple-400">.ai</span>
              </span>
            </Link>
          </motion.div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-semibold text-slate-300 hover:text-white transition">
              Log in
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/register"
                className="group relative px-5 py-2.5 rounded-full font-semibold text-xs bg-white text-slate-950 hover:bg-slate-200 transition shadow-lg shadow-white/10 flex items-center gap-1.5 overflow-hidden"
              >
                <span>Start Free Trial</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>
          </div>

        </div>
      </nav>

      {/* 1️⃣ HERO SECTION */}
      <motion.section 
        style={{ opacity, scale }}
        className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
      >
        <motion.div 
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 space-y-8"
        >
          {/* Glowing Animated Badge */}
          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/15 backdrop-blur-md text-xs font-semibold text-purple-300 shadow-xl shadow-purple-500/10 cursor-pointer"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </motion.div>
            <span>Next-Gen Global AI Expense Assistant</span>
          </motion.div>

          {/* Animated Headline */}
          <h1 className="text-5xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[1.08]">
            Master Your Expenses Right Inside{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 via-cyan-400 to-purple-400 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
              WhatsApp
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-lg font-normal leading-relaxed">
            Zero app downloads. Log spending via WhatsApp text or snap photos of receipts. AI handles categorization, multi-currency reporting, and monthly budgets instantly.
          </p>

          {/* Call to Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/register"
                className="px-8 py-4 rounded-full font-bold text-sm bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2 group"
              >
                <span>Start 7-Day Free Trial 🚀</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> No Credit Card Required
            </span>
          </div>

          {/* Live Trust Floating Avatar Stack */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-6">
            <div className="flex items-center -space-x-3">
              {[
                { bg: 'bg-purple-500', char: 'A' },
                { bg: 'bg-pink-500', char: 'M' },
                { bg: 'bg-cyan-500', char: 'K' },
                { bg: 'bg-emerald-500', char: 'S' }
              ].map((avatar, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5, scale: 1.15 }}
                  className={`w-9 h-9 rounded-full ${avatar.bg} border-2 border-[#07090e] flex items-center justify-center font-bold text-xs shadow-md cursor-pointer`}
                >
                  {avatar.char}
                </motion.div>
              ))}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Loved by 1,000+ Smart Savers</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>End-to-End Encrypted Security</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3D Dynamic Floating WhatsApp Mockup Card */}
        <motion.div 
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 relative flex justify-center"
        >
          <motion.div 
            animate={{ 
              y: [0, -15, 0],
              rotateZ: [0, 0.5, 0, -0.5, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/15 shadow-2xl space-y-4 hover:border-purple-500/40 transition-colors"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80 animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80 animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 animate-pulse" />
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Activity className="w-3 h-3 animate-spin text-emerald-400" />
                Broo AI Bot Live
              </span>
            </div>

            {/* Simulated Live WhatsApp Stream */}
            <div className="space-y-3 font-sans text-xs sm:text-sm pt-2">
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-emerald-600/30 border border-emerald-500/30 text-emerald-100 p-3 rounded-2xl rounded-tr-none max-w-[85%] ml-auto shadow-md"
              >
                Spent $45.50 on Coffee & Breakfast ☕
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 }}
                className="bg-slate-800/90 border border-white/10 text-slate-200 p-4 rounded-2xl rounded-tl-none max-w-[90%] space-y-2 shadow-lg"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  Expense Logged!
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1 text-xs">
                  <div className="bg-white/5 p-2 rounded-lg">💵 Amount: <b className="text-white">$45.50</b></div>
                  <div className="bg-white/5 p-2 rounded-lg">🏷️ Category: <b className="text-white">Dining</b></div>
                </div>
                <div className="text-[11px] text-slate-400 pt-1.5 border-t border-white/5">
                  📊 Monthly Dining: <b>$240.00 / $500.00</b>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 }}
                className="bg-emerald-600/30 border border-emerald-500/30 text-emerald-100 p-3 rounded-2xl rounded-tr-none max-w-[85%] ml-auto shadow-md"
              >
                📷 [Receipt Uploaded]
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.8 }}
                className="bg-slate-800/90 border border-purple-500/30 text-slate-200 p-3.5 rounded-2xl rounded-tl-none max-w-[90%] text-xs"
              >
                <span className="text-purple-400 font-bold">🤖 AI Scanner:</span> Extracted <b>$120.00</b> for Supermarket Groceries.
              </motion.div>

            </div>

          </motion.div>
        </motion.div>

      </motion.section>

      {/* 3️⃣ KEY FEATURES SECTION */}
      <motion.section 
        id="features" 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-7xl mx-auto px-6 py-28 border-t border-white/5"
      >
        <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-purple-400">Core Features</div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Everything You Need to Save More</h2>
          <p className="text-slate-400 text-sm">Managing personal finances globally made seamless.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <motion.div 
            variants={fadeInUp}
            whileHover={{ y: -12, scale: 1.02 }}
            className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-emerald-500/50 transition-all shadow-xl group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-3">💬 WhatsApp Logging</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              No new apps to learn. Send a simple WhatsApp chat message and Broo AI records your balance instantly.
            </p>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            whileHover={{ y: -12, scale: 1.02 }}
            className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-purple-500/50 transition-all shadow-xl group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-3">🧾 AI Receipt Scanner</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Upload photos of receipts from any supermarket or cafe. Our AI parses items, totals, and taxes accurately.
            </p>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            whileHover={{ y: -12, scale: 1.02 }}
            className="p-8 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/50 transition-all shadow-xl group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-3">📊 Global Analytics</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Get visual interactive reports of your monthly spending habits and budget status anytime.
            </p>
          </motion.div>

        </div>
      </motion.section>

      {/* 4️⃣ HOW IT WORKS */}
      <motion.section 
        id="how-it-works" 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-7xl mx-auto px-6 py-28 border-t border-white/5"
      >
        <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">Step-by-Step</div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">How It Works</h2>
          <p className="text-slate-400 text-sm">Start tracking your money in 3 easy steps.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <motion.div variants={fadeInUp} whileHover={{ scale: 1.03 }} className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 font-black flex items-center justify-center text-xl">1</div>
            <h3 className="text-xl font-bold">Sign Up & Connect</h3>
            <p className="text-slate-400 text-sm">Register your WhatsApp number and activate your 7-Day Free Trial instantly.</p>
          </motion.div>

          <motion.div variants={fadeInUp} whileHover={{ scale: 1.03 }} className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-xl">2</div>
            <h3 className="text-xl font-bold">Send a WhatsApp Chat</h3>
            <p className="text-slate-400 text-sm">Send a message like "Spent $15 for Groceries" or upload a photo of a bill.</p>
          </motion.div>

          <motion.div variants={fadeInUp} whileHover={{ scale: 1.03 }} className="p-8 rounded-3xl bg-slate-900/40 border border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-xl">3</div>
            <h3 className="text-xl font-bold">Get Instant Reports</h3>
            <p className="text-slate-400 text-sm">Receive confirmation messages, budget warnings, and live dashboard summaries.</p>
          </motion.div>

        </div>
      </motion.section>

      {/* 6️⃣ PRICING SECTION ($1.50 USD) */}
      <motion.section 
        id="pricing" 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-6 py-28 border-t border-white/5"
      >
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-purple-400">Simple Pricing</div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Global Affordable Pricing</h2>
          <p className="text-slate-400 text-sm">Try 100% free for 7 days. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-white/10 space-y-6 flex flex-col justify-between hover:border-white/20 transition-all">
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">7-Day Free Trial</div>
              <div className="text-4xl font-black mb-4">$0.00 <span className="text-xs font-normal text-slate-400">/ 7 days</span></div>
              <p className="text-slate-400 text-sm mb-6">Full features access to experience automated WhatsApp expense tracking.</p>
              
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> WhatsApp Text Logging</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> AI Receipt Reader Access</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Weekly Summary Reports</li>
              </ul>
            </div>

            <Link href="/register" className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-xs text-center transition block">
              Start Free Trial Now
            </Link>
          </div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-8 rounded-3xl bg-gradient-to-b from-purple-900/50 via-slate-900 to-slate-900 border border-purple-500/50 relative overflow-hidden space-y-6 flex flex-col justify-between shadow-2xl shadow-purple-500/20"
          >
            <div className="absolute top-4 right-4 bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
              Most Popular
            </div>

            <div>
              <div className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-2">Pro Subscription</div>
              <div className="text-5xl font-black mb-4">$1.50 <span className="text-xs font-normal text-slate-400">/ month</span></div>
              <p className="text-slate-400 text-sm mb-6">Automated Lemon Squeezy payment link sent after trial finishes.</p>
              
              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Unlimited WhatsApp Logging</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Unlimited AI Receipt Scanning</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Real-time Interactive Web Dashboard</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Priority Global Support</li>
              </ul>
            </div>

            <Link href="/register" className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 font-bold text-xs text-center transition block shadow-lg shadow-purple-500/25">
              Get Started with Pro
            </Link>
          </motion.div>

        </div>
      </motion.section>

      {/* 7️⃣ FAQ SECTION */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-28 border-t border-white/5">
        <div className="text-center mb-16 space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan-400">FAQ</div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Do I need a credit card for the Free Trial?",
              a: "No! You can sign up and start your 7-day free trial immediately without entering any credit card or billing details."
            },
            {
              q: "What happens after the 7-day trial?",
              a: "When your trial ends, you will receive an automated payment checkout link via WhatsApp & Email to upgrade to the Pro plan for just $1.50/month."
            },
            {
              q: "Can I use Broo.ai anywhere globally?",
              a: "Yes! Broo.ai works with any international WhatsApp number and supports multi-currency expense tracking automatically."
            }
          ].map((item, index) => (
            <div 
              key={index} 
              className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden hover:border-white/20 transition-all"
            >
              <button 
                onClick={() => toggleFaq(index)}
                className="w-full p-6 text-left flex justify-between items-center font-bold text-sm sm:text-base hover:text-purple-300 transition"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${activeFaq === index ? 'rotate-180 text-purple-400' : 'text-slate-500'}`} />
              </button>
              
              <AnimatePresence>
                {activeFaq === index && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
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

      {/* 8️⃣ FINAL CALL TO ACTION */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative p-12 rounded-3xl bg-gradient-to-r from-purple-900/60 via-slate-900 to-emerald-900/60 border border-white/20 text-center space-y-8 overflow-hidden shadow-2xl"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tight max-w-2xl mx-auto">
            Ready to Master Your Finances Globally?
          </h2>

          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
            Join users tracking expenses effortlessly via WhatsApp for just $1.50/month.
          </p>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-bold text-sm bg-white text-slate-950 hover:bg-slate-200 transition shadow-2xl shadow-white/20"
            >
              <span>Start 7-Day Free Trial Now 🚀</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* 🌟 9️⃣ CREATIVE FLOATING STICKY BOTTOM DOCK (Glassmorphic Bar) */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-3xl"
      >
        <div className="p-3 sm:p-4 rounded-full bg-slate-950/80 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-purple-500/20 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 pl-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Rocket className="w-4 h-4 animate-bounce" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Start Free Trial Today</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  $0.00 / 7 Days
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Instant setup • Cancel anytime • $1.50/mo after</div>
            </div>
            <span className="text-xs font-bold text-white sm:hidden">
              Broo AI <span className="text-emerald-400">$1.50/mo</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link 
              href="/register"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:scale-105 transition-transform shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <span>Try Free</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </motion.div>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12 text-center text-xs text-slate-500">
        <p>© 2026 Broo.ai — Global AI Expense Tracking Platform. Powered by Next.js & Lemon Squeezy.</p>
      </footer>

    </div>
  );
}