import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: userRow, error: dbError } = await supabaseAdmin
      .from("users")
      .select("paddle_customer_id, paddle_subscription_id")
      .eq("id", user.id)
      .single();

    if (dbError || !userRow?.paddle_customer_id) {
      return NextResponse.json({ error: "No active Paddle customer found" }, { status: 404 });
    }

    const environment = (process.env.PADDLE_ENVIRONMENT || "production").toLowerCase();
    const baseUrl = environment === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
    const response = await fetch(`${baseUrl}/customers/${userRow.paddle_customer_id}/portal-sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        userRow.paddle_subscription_id ? { subscription_ids: [userRow.paddle_subscription_id] } : {}
      ),
      cache: "no-store",
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Paddle portal session error:", json);
      return NextResponse.json({ error: "Failed to create customer portal session" }, { status: 502 });
    }

    const url = json?.data?.urls?.general?.overview;
    if (!url) return NextResponse.json({ error: "Paddle portal URL missing" }, { status: 502 });
    return NextResponse.json({ url }, { status: 200 });
  } catch (error: any) {
    console.error("Portal link error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
