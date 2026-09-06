// app/api/get-user-plan/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// This route uses the service-role client (bypasses RLS) and is called
// unauthenticated right after checkout — before the user necessarily has
// a logged-in session — to poll whether the Lemon Squeezy webhook has
// updated payment_status yet. Because it runs before login, it can't
// require a Supabase auth token like portal-link/route.ts does.
//
// Previously this only checked `phone`, which let anyone enumerate any
// registered phone number and read back their plan/payment_status/
// is_active. Requiring BOTH phone AND email to match the same row makes
// blind enumeration impractical (an attacker now needs a valid
// phone+email pair, not just a phone number) while still letting the
// legitimate checkout-redirect flow (which knows both) poll normally.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");

    if (!phone || !email) {
      return NextResponse.json(
        { error: "Phone number and email are both required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("plan, payment_status, is_active, email")
      .eq("phone_number", phone)
      .single();

    // Deliberately return the same "not found" shape whether the phone
    // doesn't exist OR the email doesn't match — don't let a caller learn
    // "phone exists but email is wrong" (that would still leak enumeration).
    if (error || !data || data.email?.toLowerCase() !== email.trim().toLowerCase()) {
      // Webhook eka thawama process wela nathi wenna puluwan (race condition)
      // 404 kiyala evanawa - frontend eken retry karanna
      return NextResponse.json(
        { error: "User not found or not yet updated", found: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      found: true,
      plan: data.plan || "LITE",
      payment_status: data.payment_status,
      is_active: data.is_active,
    });
  } catch (error: any) {
    console.error("get-user-plan error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
