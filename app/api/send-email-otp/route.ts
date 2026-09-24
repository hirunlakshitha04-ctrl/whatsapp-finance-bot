import { NextResponse } from "next/server";
import { randomInt, createHmac } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import nodemailer from "nodemailer";

const RESEND_COOLDOWN_MS = 60 * 1000;
const IP_LIMIT = 5;
const IP_WINDOW_SECONDS = 15 * 60;
const EMAIL_LIMIT = 10;
const EMAIL_WINDOW_SECONDS = 60 * 60;
const OTP_HASH_SECRET = process.env.OTP_HASH_SECRET;

const GENERIC_RESPONSE = {
  success: true,
  message: "If this email is registered, a 6-digit OTP code has been sent to it.",
};

function hashOtp(email: string, otp: string) {
  if (!OTP_HASH_SECRET) throw new Error("OTP_HASH_SECRET is not configured.");
  return createHmac("sha256", OTP_HASH_SECRET)
    .update(`${email}:${otp}`)
    .digest("hex");
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

async function consumeRateLimit(key: string, limit: number, windowSeconds: number) {
  const { data, error } = await supabaseAdmin.rpc("consume_otp_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) throw error;
  return Boolean(data?.[0]?.allowed);
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || cleanEmail.length > 320) {
      return NextResponse.json({ success: false, error: "Invalid email." }, { status: 400 });
    }

    // These limits are enforced atomically in PostgreSQL, so concurrent requests
    // cannot all pass a read-then-write counter check.
    const ip = getClientIp(req);
    const ipAllowed = await consumeRateLimit(`otp:ip:${ip}`, IP_LIMIT, IP_WINDOW_SECONDS);
    const emailAllowed = await consumeRateLimit(`otp:email:${cleanEmail}`, EMAIL_LIMIT, EMAIL_WINDOW_SECONDS);

    if (!ipAllowed || !emailAllowed) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("email")
      .ilike("email", cleanEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const { data: existingReset } = await supabaseAdmin
      .from("password_resets")
      .select("created_at")
      .eq("email", user.email)
      .maybeSingle();

    if (existingReset?.created_at) {
      const elapsedMs = Date.now() - new Date(existingReset.created_at).getTime();
      if (elapsedMs < RESEND_COOLDOWN_MS) return NextResponse.json(GENERIC_RESPONSE);
    }

    // Cryptographically secure 6-digit OTP. Math.random() is not suitable for secrets.
    const otp = randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(user.email.toLowerCase(), otp);

    // Never store the plaintext OTP. Remove the old row first so one email has
    // exactly one active reset code.
    await supabaseAdmin.from("password_resets").delete().eq("email", user.email);

    const { error: insertError } = await supabaseAdmin
      .from("password_resets")
      .insert({
        email: user.email,
        otp_hash: otpHash,
        attempts: 0,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("OTP record creation failed");
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const transporter = nodemailer.createTransport({
      host: "mail.privateemail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"BroFInAi Support" <${process.env.EMAIL_SERVER_USER}>`,
      to: user.email,
      subject: "Your Password Reset OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff;">
          <div style="max-width: 450px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid #334155;">
            <h2 style="color: #10b981; margin-bottom: 8px;">Reset Password</h2>
            <p style="color: #94a3b8; font-size: 14px;">Use the OTP code below to reset your password.</p>
            <div style="font-size: 36px; font-weight: bold; color: #10b981; letter-spacing: 6px; margin: 25px 0; text-align: center; background: #0f172a; padding: 15px; border-radius: 12px;">${otp}</div>
            <p style="color: #64748b; font-size: 12px; text-align: center;">This code will expire in 10 minutes and allows a maximum of 5 attempts. If you did not request this, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json(GENERIC_RESPONSE);
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(GENERIC_RESPONSE);
  }
}
