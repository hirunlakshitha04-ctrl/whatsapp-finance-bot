import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { variantId, userEmail, userId } = await req.json();

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    const targetVariantId = variantId || process.env.LEMONSQUEEZY_PRO_VARIANT_ID;

    // Check Env
    if (!apiKey || !storeId || !targetVariantId) {
      return NextResponse.json(
        { error: `Missing Env variables! storeId: ${storeId}, variantId: ${targetVariantId}` },
        { status: 400 }
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
                user_id: String(userId || 'guest_user'),
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
                id: String(targetVariantId),
              },
            },
          },
        },
      }),
    });

    const resData = await response.json();

    if (!response.ok) {
      console.error('Lemon Squeezy API Returned Error:', JSON.stringify(resData));
      // Lemon Squeezy එකෙන් ආපු exact error එක frontend එකට යවනවා
      const errorMessage = resData?.errors?.[0]?.detail || resData?.errors?.[0]?.title || 'Lemon Squeezy Error';
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    return NextResponse.json({ url: resData.data.attributes.url });
  } catch (err: any) {
    console.error('Fetch Crash:', err);
    return NextResponse.json({ error: err.message || 'Server Fetch Failed' }, { status: 500 });
  }
}