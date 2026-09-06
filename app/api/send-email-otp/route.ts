import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import nodemailer from "nodemailer";

// Minimum time a user must wait before requesting another OTP for the
// same email. Stops an attacker (or an impatient user) from flooding the
// mailbox / regenerating fresh codes every second.
const RESEND_COOLDOWN_MS = 60 * 1000;

// Generic response used for BOTH "email not found" and "OTP sent"
// outcomes. Previously this endpoint returned a distinct 404 "Email not
// found in our records" error, which let an attacker enumerate which
// emails are registered simply by probing this endpoint. Never leak that
// distinction to the caller.
const GENERIC_RESPONSE = {
  success: true,
  message: "If this email is registered, a 6-digit OTP code has been sent to it.",
};

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if user exists in database — result is intentionally never
    // reflected back to the caller (see GENERIC_RESPONSE above).
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("email")
      .ilike("email", cleanEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    // 2. Resend cooldown — if a still-fresh OTP was issued very recently,
    // don't silently regenerate/re-email a new one every request.
    const { data: existingReset } = await supabaseAdmin
      .from("password_resets")
      .select("created_at")
      .eq("email", user.email)
      .maybeSingle();

    if (existingReset?.created_at) {
      const elapsedMs = Date.now() - new Date(existingReset.created_at).getTime();
      if (elapsedMs < RESEND_COOLDOWN_MS) {
        // Still return the generic success shape so behavior is
        // indistinguishable from a fresh send to an outside observer.
        return NextResponse.json(GENERIC_RESPONSE);
      }
    }

    // 3. Generate 6-Digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Save OTP in 'password_resets' table (attempts resets to 0 on every
    // fresh code so a brute-force run against an old code can't carry over)
    await supabaseAdmin.from("password_resets").delete().eq("email", user.email);

    const { error: insertError } = await supabaseAdmin
      .from("password_resets")
      .insert([
        {
          email: user.email,
          otp: otp,
          attempts: 0,
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error("OTP insert error:", insertError);
      // Still return the generic response — don't leak internal state.
      return NextResponse.json(GENERIC_RESPONSE);
    }

    // 5. Send Email via Nodemailer — Namecheap Private Email SMTP
    const transporter = nodemailer.createTransport({
      host: "mail.privateemail.com",
      port: 465,
      secure: true, // true for port 465 (SSL)
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
            <div style="font-size: 36px; font-weight: bold; color: #10b981; letter-spacing: 6px; margin: 25px 0; text-align: center; background: #0f172a; padding: 15px; border-radius: 12px;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 12px; text-align: center;">This code will expire in 10 minutes and allows a maximum of 5 attempts. If you did not request this, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (err: any) {
    console.error("API Error:", err);
    // Even on unexpected errors, avoid leaking whether the email exists.
    return NextResponse.json(GENERIC_RESPONSE);
  }
}