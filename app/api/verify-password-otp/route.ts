import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const OTP_HASH_SECRET = process.env.OTP_HASH_SECRET;

function hashOtp(email: string, otp: string) {
  if (!OTP_HASH_SECRET) throw new Error("OTP_HASH_SECRET is not configured.");
  return createHmac("sha256", OTP_HASH_SECRET).update(`${email}:${otp}`).digest("hex");
}

function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }
    if (String(newPassword).length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters and include both letters and numbers." }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const submittedOtp = String(otp).trim();
    if (!/^\d{6}$/.test(submittedOtp)) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP code." }, { status: 400 });
    }
    if (!OTP_HASH_SECRET) throw new Error("OTP_HASH_SECRET is not configured.");

    const { data: resetData, error: otpError } = await supabaseAdmin
      .from("password_resets")
      .select("email, otp_hash, attempts, created_at")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (otpError || !resetData) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP code." }, { status: 400 });
    }

    const issuedAt = new Date(resetData.created_at).getTime();
    if (Number.isNaN(issuedAt) || Date.now() - issuedAt > OTP_TTL_MS) {
      await supabaseAdmin.from("password_resets").delete().eq("email", cleanEmail);
      return NextResponse.json({ success: false, error: "This OTP code has expired. Please request a new one." }, { status: 400 });
    }

    const attemptsSoFar = Number(resetData.attempts) || 0;
    if (attemptsSoFar >= MAX_ATTEMPTS) {
      await supabaseAdmin.from("password_resets").delete().eq("email", cleanEmail);
      return NextResponse.json({ success: false, error: "Too many incorrect attempts. Please request a new OTP code." }, { status: 429 });
    }

    const expectedHash = String(resetData.otp_hash);
    const submittedHash = hashOtp(cleanEmail, submittedOtp);
    const isValid = safeEqualHex(expectedHash, submittedHash);

    // Atomic RPC prevents two simultaneous bad requests from both reading the
    // same attempts value and bypassing the 5-attempt limit.
    if (!isValid) {
      const { data: result, error: incrementError } = await supabaseAdmin.rpc("record_password_reset_attempt", {
        p_email: cleanEmail,
        p_max_attempts: MAX_ATTEMPTS,
      });
      if (incrementError) throw incrementError;

      const row = result?.[0];
      const attempts = Number(row?.attempts ?? attemptsSoFar + 1);
      if (attempts >= MAX_ATTEMPTS) {
        await supabaseAdmin.from("password_resets").delete().eq("email", cleanEmail);
        return NextResponse.json({ success: false, error: "Invalid OTP code. Please request a new one." }, { status: 429 });
      }
      const remaining = MAX_ATTEMPTS - attempts;
      return NextResponse.json({ success: false, error: `Invalid OTP code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` }, { status: 400 });
    }

    // Atomically consume the OTP so two concurrent valid requests cannot both
    // reuse the same code. The database condition is the concurrency boundary.
    const { data: consumeResult, error: consumeError } = await supabaseAdmin.rpc("consume_password_reset_otp", {
      p_email: cleanEmail,
      p_otp_hash: submittedHash,
      p_max_attempts: MAX_ATTEMPTS,
      p_ttl_seconds: OTP_TTL_MS / 1000,
    });
    if (consumeError) throw consumeError;
    if (!consumeResult?.[0]?.consumed) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP code." }, { status: 400 });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    const targetUser = userData?.users.find((u) => u.email?.toLowerCase() === cleanEmail);
    if (userError || !targetUser) {
      return NextResponse.json({ success: false, error: "User account not found." }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, { password: newPassword });
    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    await supabaseAdmin.from("password_resets").delete().eq("email", cleanEmail);
    return NextResponse.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    console.error("Reset Password API Error:", err);
    return NextResponse.json({ success: false, error: "Failed to reset password." }, { status: 500 });
  }
}
