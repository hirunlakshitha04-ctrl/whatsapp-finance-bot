import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: userRow, error: dbError } = await supabaseAdmin
      .from("users")
      .select("lemon_squeezy_subscription_id")
      .eq("id", user.id)
      .single();

    if (dbError || !userRow?.lemon_squeezy_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${userRow.lemon_squeezy_subscription_id}`,
      {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Lemon Squeezy API error:", errText);
      return NextResponse.json(
        { error: "Failed to fetch portal link" },
        { status: 502 }
      );
    }

    const json = await res.json();
    const portalUrl = json?.data?.attributes?.urls?.customer_portal;

    if (!portalUrl) {
      return NextResponse.json(
        { error: "Portal URL missing in response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: portalUrl });
  } catch (error: any) {
    console.error("Portal link error:", error);
    return NextResponse.json(
      { error: "Internal error", details: error.message },
      { status: 500 }
    );
  }
}