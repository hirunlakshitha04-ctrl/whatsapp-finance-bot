// app/api/get-user-plan/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number missing" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("plan, payment_status, is_active")
      .eq("phone_number", phone)
      .single();

    if (error || !data) {
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