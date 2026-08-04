import { NextRequest, NextResponse } from "next/server";
import { lemonSqueezySetup, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { variantId, phone, email } = body;

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;

    // Default Variant ID from Environment Variable
    const rawVariantId = variantId || process.env.NEXT_PUBLIC_LEMON_PRO_MONTHLY_VARIANT_ID;

    if (!apiKey || !storeId || !rawVariantId) {
      console.error("❌ Configuration Missing:", {
        hasApiKey: !!apiKey,
        storeId,
        rawVariantId,
      });
      return NextResponse.json(
        { error: "Missing Lemon Squeezy environment configuration" },
        { status: 400 }
      );
    }

    // Initialize Lemon Squeezy SDK
    lemonSqueezySetup({
      apiKey,
      onError: (error) => console.error("Lemon Squeezy Setup Error:", error),
    });

    const formattedStoreId = String(storeId).trim();
    const formattedVariantId = Number(rawVariantId);

    if (isNaN(formattedVariantId)) {
      console.error("❌ Invalid Variant ID format:", rawVariantId);
      return NextResponse.json(
        { error: "Invalid Variant ID format" },
        { status: 400 }
      );
    }

    // Prepare Custom Metadata
    const customData: Record<string, string> = {};
    if (phone) customData.phone = String(phone);

    // Create Checkout Session
    const checkout = await createCheckout(formattedStoreId, formattedVariantId, {
      checkoutData: {
        email: email ? String(email) : undefined,
        custom: customData,
      },
      productOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
      },
    });

    // Check SDK Response Error
    if (checkout.error) {
      console.error("❌ Lemon Squeezy API Returned Error:", checkout.error);
      return NextResponse.json(
        { error: checkout.error.message || "Failed to create checkout session" },
        { status: 422 }
      );
    }

    const checkoutUrl = checkout.data?.data?.attributes?.url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Checkout URL was not generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutUrl }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Checkout Route Server Exception:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}