import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phone, email, priceId } = body;
    const resolvedPriceId = String(priceId || process.env.NEXT_PUBLIC_PADDLE_CORE_MONTHLY_PRICE_ID || "").trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://brofinai.com";

    if (!process.env.PADDLE_API_KEY || !resolvedPriceId) {
      return NextResponse.json({ error: "Missing Paddle environment configuration" }, { status: 400 });
    }

    const environment = (process.env.PADDLE_ENVIRONMENT || "production").toLowerCase();
    const baseUrl = environment === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
    const response = await fetch(`${baseUrl}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ price_id: resolvedPriceId, quantity: 1 }],
        collection_mode: "automatic",
        custom_data: {
          phone: phone ? String(phone) : "",
          email: email ? String(email) : "",
          source: "pulse-tier-card",
          checkout_id: randomUUID(),
        },
      }),
      cache: "no-store",
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ error: json?.error?.detail || "Paddle checkout creation failed" }, { status: 422 });
    }

    const transactionId = json?.data?.id;
    const url = json?.data?.checkout?.url;
    if (!transactionId && !url) return NextResponse.json({ error: "Paddle checkout was not created" }, { status: 502 });
    return NextResponse.json({ transactionId, url }, { status: 200 });
  } catch (error: any) {
    console.error("Paddle checkout route error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
