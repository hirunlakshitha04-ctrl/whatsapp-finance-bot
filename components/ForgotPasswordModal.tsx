"use client";

import { useState } from "react";
import { Mail, KeyRound, AlertCircle, CheckCircle, X, ShieldCheck } from "lucide-react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInput?: string;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialInput = "",
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"email_input" | "otp_verify">("email_input");
  const [email, setEmail] = useState(initialInput);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  if (!isOpen) return null;

  const handleClose = () => {
    setStep("email_input");
    setOtpCode("");
    setNewPassword("");
    setMsg({ type: "", text: "" });
    onClose();
  };

  // 1. Send OTP to Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const res = await fetch("/api/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setMsg({ type: "success", text: "6-digit OTP code sent to your email!" });
        setStep("otp_verify");
      } else {
        setMsg({ type: "error", text: data.error || "Failed to send OTP." });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Something went wrong sending OTP." });
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP & Update Password via Server API Route
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const res = await fetch("/api/reset-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otpCode.trim(),
          newPassword: newPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMsg({ type: "success", text: "Password reset successful! Closing..." });
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setMsg({ type: "error", text: data.error || "Failed to reset password." });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Error resetting password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl relative space-y-5">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <KeyRound className="text-emerald-400" size={20} /> Reset Password
          </h3>
          <p className="text-xs text-slate-400">
            {step === "email_input"
              ? "Enter your email to receive a 6-digit OTP code."
              : "Enter the OTP code sent to your email and new password."}
          </p>
        </div>

        {/* Alert Messages */}
        {msg.text && (
          <div
            className={`flex items-center gap-2 text-xs p-3 rounded-xl border ${
              msg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            {msg.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* STEP 1: Enter Email Form */}
        {step === "email_input" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                placeholder="Enter Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-sm text-slate-200 pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-2xl transition text-sm flex justify-center disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Get OTP Code"}
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTP & New Password Form */}
        {step === "otp_verify" && (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div className="relative">
              <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                maxLength={6}
                placeholder="Enter 6-Digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-sm text-slate-200 pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500/50 tracking-widest text-center font-bold"
              />
            </div>

            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                placeholder="Enter New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-sm text-slate-200 pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-2xl transition text-sm flex justify-center disabled:opacity-50"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}