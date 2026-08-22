import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if user exists in database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email")
      .ilike("email", cleanEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Email not found in our records." },
        { status: 404 }
      );
    }

    // 2. Generate 6-Digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save OTP in 'password_resets' table
    await supabase.from("password_resets").delete().eq("email", user.email);

    const { error: insertError } = await supabase
      .from("password_resets")
      .insert([
        {
          email: user.email,
          otp: otp,
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      return NextResponse.json(
        { success: false, error: "Failed to process OTP request." },
        { status: 500 }
      );
    }

    // 4. Send Email via Nodemailer — Namecheap Private Email SMTP
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
            <p style="color: #64748b; font-size: 12px; text-align: center;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "OTP code sent to your email!",
    });
  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to send Email OTP." },
      { status: 500 }
    );
  }
}