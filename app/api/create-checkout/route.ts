// app/api/create-checkout/route.ts
import { NextRequest, NextResponse } from "next/server";

const VARIANT_IDS: Record<string, string | undefined> = {
  core: process.env.NEXT_PUBLIC_LEMON_CORE_MONTHLY_VARIANT_ID,
  max: process.env.NEXT_PUBLIC_LEMON_MAX_MONTHLY_VARIANT_ID,
  pro: process.env.NEXT_PUBLIC_LEMON_MAX_MONTHLY_VARIANT_ID,
  orbit: process.env.NEXT_PUBLIC_LEMON_MAX_MONTHLY_VARIANT_ID,
};

export async function POST(req: NextRequest) {
  try {
    const { plan, phone, email, name } = await req.json();

    const normalizedPlan = (plan || "core").toLowerCase().trim();
    const variantId = VARIANT_IDS[normalizedPlan] || VARIANT_IDS.core;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

    if (!apiKey || !storeId || !variantId) {
      console.error("Missing Lemon Squeezy env config", {
        hasApiKey: !!apiKey,
        storeId,
        variantId,
      });
      return NextResponse.json(
        { error: "Checkout is not configured correctly." },
        { status: 500 }
      );
    }

    // Build the origin from the incoming request so this works in every
    // environment (local, preview, production) without hardcoding a domain.
    const host = req.headers.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const cleanedPhone = (phone || "").toString().trim();

    // This redirect_url is set on the CHECKOUT OBJECT via the API, which
    // Lemon Squeezy officially guarantees to honour — unlike appending
    // checkout[product_options][redirect_url] as a query string to a static
    // buy link, which is NOT reliably respected.
    const redirectUrl = `${origin}/payment-success?plan=${encodeURIComponent(
      normalizedPlan
    )}&type=direct&phone=${encodeURIComponent(cleanedPhone)}`;

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          product_options: {
            redirect_url: redirectUrl,
          },
          checkout_options: {
            embed: true,
          },
          checkout_data: {
            email: email || undefined,
            name: name || undefined,
            custom: cleanedPhone ? { phone: cleanedPhone } : undefined,
          },
        },
        relationships: {
          store: {
            data: { type: "stores", id: String(storeId) },
          },
          variant: {
            data: { type: "variants", id: String(variantId) },
          },
        },
      },
    };

    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Lemon Squeezy checkout creation failed:", data);
      return NextResponse.json(
        { error: "Could not create checkout." },
        { status: 502 }
      );
    }

    const checkoutUrl = data?.data?.attributes?.url;
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "No checkout URL returned." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: checkoutUrl, redirectUrl });
  } catch (err) {
    console.error("create-checkout error:", err);
    return NextResponse.json(
      { error: "Unexpected error creating checkout." },
      { status: 500 }
    );
  }
}