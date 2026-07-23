import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { variantId, userId, userEmail } = await req.json();

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: userEmail,
              custom: {
                user_id: userId,
              },
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: process.env.LEMONSQUEEZY_STORE_ID,
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId || process.env.LEMONSQUEEZY_PRO_VARIANT_ID,
              },
            },
          },
        },
      }),
    });

    const data = await response.json();
    return NextResponse.json({ url: data.data.attributes.url });
  } catch (error) {
    return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 });
  }
}