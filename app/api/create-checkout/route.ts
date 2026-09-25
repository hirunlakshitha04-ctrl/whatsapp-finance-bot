import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PRICE_ENV_MAP: Record<string, Record<string, string>> = {
  core: {
    whatsapp: "NEXT_PUBLIC_PADDLE_CORE_WHATSAPP_MONTHLY_PRICE_ID",
    telegram: "NEXT_PUBLIC_PADDLE_CORE_TELEGRAM_MONTHLY_PRICE_ID",
  },
  max: {
    whatsapp: "NEXT_PUBLIC_PADDLE_MAX_WHATSAPP_MONTHLY_PRICE_ID",
    telegram: "NEXT_PUBLIC_PADDLE_MAX_TELEGRAM_MONTHLY_PRICE_ID",
  },
};

const FALLBACK_PRICE_ENV_MAP: Record<string, string> = {
  core: "NEXT_PUBLIC_PADDLE_CORE_MONTHLY_PRICE_ID",
  max: "NEXT_PUBLIC_PADDLE_MAX_MONTHLY_PRICE_ID",
};

function resolvePriceId(plan: string, channel: string, explicit?: string) {
  if (explicit) return String(explicit).trim();
  const planKey = plan.toLowerCase().trim();
  const channelKey = channel === "telegram" ? "telegram" : "whatsapp";
  const specific = PRICE_ENV_MAP[planKey]?.[channelKey];
  const specificValue = specific ? process.env[specific] : undefined;
  if (specificValue) return specificValue.trim();
  const fallback = FALLBACK_PRICE_ENV_MAP[planKey];
  return fallback ? process.env[fallback]?.trim() : undefined;
}

async function paddleRequest(path: string, init: RequestInit = {}) {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error("Missing PADDLE_API_KEY");

  const environment = (process.env.PADDLE_ENVIRONMENT || "production").toLowerCase();
  const baseUrl = environment === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Paddle API error:", response.status, json);
    throw new Error(json?.error?.detail || json?.error?.code || "Paddle API request failed");
  }
  return json;
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
      priceId: explicitPriceId,
      user_id: userId,
      mode,
    } = body;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://brofinai.com";
    const planKey = (plan || "core").toLowerCase().trim();
    const channelKey = channel === "telegram" ? "telegram" : "whatsapp";
    const priceId = resolvePriceId(planKey, channelKey, explicitPriceId);

    if (!process.env.PADDLE_API_KEY || !priceId) {
      console.error("Paddle configuration missing", {
        hasApiKey: !!process.env.PADDLE_API_KEY,
        plan: planKey,
        channel: channelKey,
        priceId,
      });
      return NextResponse.json(
        { error: "Missing Paddle environment configuration for this plan/channel" },
        { status: 400 }
      );
    }

    const isUpgrade = mode === "upgrade" && !!userId;
    const customData: Record<string, string> = {};
    let successUrl: string;

    if (isUpgrade) {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.replace(/^Bearer\s+/i, "");
      if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

      const { data: { user: verifiedUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !verifiedUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      if (verifiedUser.id !== userId) return NextResponse.json({ error: "User mismatch" }, { status: 403 });

      const { data: existingUser, error: userFetchErr } = await supabaseAdmin
        .from("users")
        .select("id, email, phone_number, telegram_chat_id")
        .eq("id", verifiedUser.id)
        .maybeSingle();

      if (userFetchErr || !existingUser) {
        return NextResponse.json({ error: "User not found for upgrade" }, { status: 404 });
      }

      const alreadyLinked =
        (channelKey === "whatsapp" && !!existingUser.phone_number) ||
        (channelKey === "telegram" && !!existingUser.telegram_chat_id);

      let upgradeLinkToken: string | null = null;
      if (!alreadyLinked) {
        upgradeLinkToken = randomUUID();
        const { error } = await supabaseAdmin
          .from("users")
          .update({ link_token: upgradeLinkToken })
          .eq("id", verifiedUser.id);
        if (error) {
          console.error("Failed to save upgrade link_token:", error);
          return NextResponse.json({ error: "Failed to prepare channel link" }, { status: 500 });
        }
      }

      customData.user_id = verifiedUser.id;
      customData.mode = "upgrade";
      customData.plan = planKey;
      customData.channel = channelKey;
      customData.already_linked = String(alreadyLinked);
      if (upgradeLinkToken) customData.link_token = upgradeLinkToken;

      const params = new URLSearchParams({
        mode: "upgrade",
        plan: planKey,
        channel: channelKey,
        already_linked: String(alreadyLinked),
        is_upgrade: "true",
      });
      if (upgradeLinkToken) params.set("link_token", upgradeLinkToken);
      successUrl = `${appUrl}/payment-success?${params.toString()}`;
    } else {
      if (phone) customData.phone = String(phone);
      if (email) customData.email = String(email);
      if (name) customData.name = String(name);
      customData.channel = channelKey;
      customData.plan = planKey;
      if (linkToken) customData.link_token = String(linkToken);

      const params = new URLSearchParams({ plan: planKey, channel: channelKey });
      if (phone) params.set("phone", String(phone));
      if (linkToken) params.set("link_token", String(linkToken));
      successUrl = `${appUrl}/payment-success?${params.toString()}`;
    }

    // Paddle creates the subscription automatically after the recurring
    // transaction completes. Custom data is copied to that subscription.
    const transaction = await paddleRequest("/transactions", {
      method: "POST",
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        collection_mode: "automatic",
        custom_data: customData,
      }),
    });

    const transactionId = transaction?.data?.id;
    if (!transactionId) {
      return NextResponse.json({ error: "Paddle transaction was not created" }, { status: 502 });
    }

    return NextResponse.json(
      {
        transactionId,
        url: transaction?.data?.checkout?.url || null,
        redirectUrl: successUrl,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Checkout Route Server Exception:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
