import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { variantId, userId, userEmail } = await req.json();

    // Environment variables හරියට තියෙනවද බලන්න check එකක්
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const selectedVariantId = variantId || process.env.LEMONSQUEEZY_PRO_VARIANT_ID;

    if (!apiKey || !storeId || !selectedVariantId) {
      console.error('Missing Environment Variables:', { apiKey: !!apiKey, storeId, selectedVariantId });
      return NextResponse.json(
        { error: 'Server configuration error. Missing API Key or Store/Variant ID.' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: userEmail || 'test@example.com',
              custom: {
                user_id: userId || 'guest',
              },
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: String(storeId),
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: String(selectedVariantId),
              },
            },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Lemon Squeezy API Error:', data);
      return NextResponse.json({ error: data.errors?.[0]?.detail || 'Lemon Squeezy API Error' }, { status: response.status });
    }

    return NextResponse.json({ url: data.data.attributes.url });
  } catch (error: any) {
    console.error('Checkout creation internal error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}