import { NextRequest, NextResponse } from "next/server";
import { lemonSqueezySetup, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";

// Plan + channel -> Lemon Squeezy variant ID env var name.
// WhatsApp and Telegram are priced differently (see pricing page), so each
// plan needs a variant per channel. If a channel-specific variant isn't
// configured yet, we fall back to a channel-agnostic one so this doesn't
// break before both Lemon Squeezy products exist.
const VARIANT_ENV_MAP: Record<string, Record<string, string>> = {
  core: {
    whatsapp: "NEXT_PUBLIC_LEMON_CORE_WHATSAPP_MONTHLY_VARIANT_ID",
    telegram: "NEXT_PUBLIC_LEMON_CORE_TELEGRAM_MONTHLY_VARIANT_ID",
  },
  max: {
    whatsapp: "NEXT_PUBLIC_LEMON_MAX_WHATSAPP_MONTHLY_VARIANT_ID",
    telegram: "NEXT_PUBLIC_LEMON_MAX_TELEGRAM_MONTHLY_VARIANT_ID",
  },
};

// Channel-agnostic fallback env vars (used only if the channel-specific one above isn't set).
const VARIANT_FALLBACK_ENV_MAP: Record<string, string> = {
  core: "NEXT_PUBLIC_LEMON_CORE_MONTHLY_VARIANT_ID",
  max: "NEXT_PUBLIC_LEMON_MAX_MONTHLY_VARIANT_ID",
};

function resolveVariantId(plan: string, channel: string): string | undefined {
  const planKey = plan.toLowerCase().trim();
  const channelKey = channel === "telegram" ? "telegram" : "whatsapp";

  const specificEnvName = VARIANT_ENV_MAP[planKey]?.[channelKey];
  const specificValue = specificEnvName ? process.env[specificEnvName] : undefined;
  if (specificValue) return specificValue;

  const fallbackEnvName = VARIANT_FALLBACK_ENV_MAP[planKey];
  return fallbackEnvName ? process.env[fallbackEnvName] : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      plan,
      phone,
      email,
      name,
      channel,
      link_token: linkToken,
      variantId: explicitVariantId,
    } = body;

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const planKey = (plan || "core").toLowerCase().trim();
    const channelKey = channel === "telegram" ? "telegram" : "whatsapp";

    // Explicit variantId (if ever passed directly) wins; otherwise resolve
    // from plan + channel.
    const rawVariantId = explicitVariantId || resolveVariantId(planKey, channelKey);

    if (!apiKey || !storeId || !rawVariantId) {
      console.error("❌ Configuration Missing:", {
        hasApiKey: !!apiKey,
        storeId,
        plan: planKey,
        channel: channelKey,
        rawVariantId,
      });
      return NextResponse.json(
        { error: "Missing Lemon Squeezy environment configuration for this plan/channel" },
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

    // Prepare Custom Metadata — carried through to the order/webhook payload
    // so fulfillment can match the order back to this user + channel.
    const customData: Record<string, string> = {};
    if (phone) customData.phone = String(phone);
    if (email) customData.email = String(email);
    if (name) customData.name = String(name);
    if (channelKey) customData.channel = channelKey;
    if (planKey) customData.plan = planKey;
    if (linkToken) customData.link_token = String(linkToken);

    // Build the post-payment redirect URL — this is what the payment-success
    // page reads to know which channel to auto-redirect the user into
    // (wa.me for WhatsApp, t.me/<bot>?start=<link_token> for Telegram).
    const redirectParams = new URLSearchParams({ plan: planKey, channel: channelKey });
    if (channelKey === "whatsapp" && phone) redirectParams.set("phone", String(phone));
    if (channelKey === "telegram" && linkToken) redirectParams.set("link_token", String(linkToken));
    const redirectUrl = `${appUrl}/payment-success?${redirectParams.toString()}`;

    // Create Checkout Session
    const checkout = await createCheckout(formattedStoreId, formattedVariantId, {
      checkoutData: {
        email: email ? String(email) : undefined,
        custom: customData,
      },
      productOptions: {
        redirectUrl,
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

    // redirectUrl is echoed back so the client can fire it immediately on the
    // Checkout.Success overlay event, instead of waiting on Lemon Squeezy's
    // own redirect (see lemonSuccessUrlRef in the register page).
    return NextResponse.json({ url: checkoutUrl, redirectUrl }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Checkout Route Server Exception:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}