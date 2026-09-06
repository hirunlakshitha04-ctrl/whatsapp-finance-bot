import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin client — Service Role Key needed to update a user's password directly
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // .env.local / hosting env vars
);

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes, matches the email copy
const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Server-side password strength check — the dashboard form enforces
    // this in the browser, but this API can be called directly, so the
    // check must also live here.
    if (
      String(newPassword).length < 8 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters and include both letters and numbers." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Load the pending reset row for this email
    const { data: resetData, error: otpError } = await supabaseAdmin
      .from("password_resets")
      .select("*")
      .ilike("email", cleanEmail)
      .single();

    if (otpError || !resetData) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP code." },
        { status: 400 }
      );
    }

    // 2. Expiry check — previously never enforced in code (only mentioned
    // in the email copy), so a stale OTP would work forever.
    const issuedAt = new Date(resetData.created_at).getTime();
    if (Number.isNaN(issuedAt) || Date.now() - issuedAt > OTP_TTL_MS) {
      await supabaseAdmin.from("password_resets").delete().eq("email", cleanEmail);
      return NextResponse.json(
        { success: false, error: "This OTP code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 3. Attempt lockout — stops a script from brute-forcing the 1,000,000
    // possible 6-digit codes against this row.
    const attemptsSoFar = resetData.attempts || 0;
    if (attemptsSoFar >= MAX_ATTEMPTS) {
      await supabaseAdmin.from("password_resets").delete().eq("email", cleanEmail);
      return NextResponse.json(
        { success: false, error: "Too many incorrect attempts. Please request a new OTP code." },
        { status: 429 }
      );
    }

    // 4. Compare the submitted code
    if (String(resetData.otp) !== String(otp).trim()) {
      await supabaseAdmin
        .from("password_resets")
        .update({ attempts: attemptsSoFar + 1 })
        .eq("email", cleanEmail);

      const remaining = MAX_ATTEMPTS - (attemptsSoFar + 1);
      return NextResponse.json(
        {
          success: false,
          error:
            remaining > 0
              ? `Invalid OTP code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
              : "Invalid OTP code. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // 5. Find the user's auth ID
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.listUsers();

    const targetUser = userData?.users.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (userError || !targetUser) {
      return NextResponse.json(
        { success: false, error: "User account not found." },
        { status: 404 }
      );
    }

    // 6. Update the password using Admin privileges
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: newPassword }
    );

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // 7. Delete the used OTP so it can never be replayed
    await supabaseAdmin.from("password_resets").delete().eq("email", cleanEmail);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully!",
    });
  } catch (err: any) {
    console.error("Verify Password OTP API Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to reset password." },
      { status: 500 }
    );
  }
}
