import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service Role Key එක භාවිතා කරමින් Admin Supabase Client එකක් සාදාගැනීම
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // .env.local එකේ තිබිය යුතුය
);

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify OTP in 'password_resets' table
    const { data: resetData, error: otpError } = await supabaseAdmin
      .from("password_resets")
      .select("*")
      .ilike("email", cleanEmail)
      .eq("otp", otp.trim())
      .single();

    if (otpError || !resetData) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP code." },
        { status: 400 }
      );
    }

    // 2. Get User ID from Supabase Auth Admin
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

    // 3. Update User Password using Admin Privileges
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

    // 4. Delete used OTP
    await supabaseAdmin.from("password_resets").delete().eq("email", cleanEmail);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully!",
    });
  } catch (err: any) {
    console.error("Reset Password API Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to reset password." },
      { status: 500 }
    );
  }
}