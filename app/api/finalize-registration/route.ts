import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ---------------------------------------------------------------------------
// FINALIZE REGISTRATION — writes the public.users profile row and, if that
// write fails right after a FRESH auth.signUp(), deletes the orphaned auth
// user so the email is never left permanently stuck.
//
// BUG THIS FIXES: register/page.tsx used to call supabase.from("users").upsert
// directly from the browser (anon key, can't touch auth.users). The client-side
// duplicate-phone check (check_duplicate_contact RPC) is best-effort — if it
// ever missed a race or failed to run, auth.signUp() would still succeed,
// then this upsert would fail on the phone_number unique constraint (23505).
// The auth.users row from that signUp was never cleaned up, so the email was
// permanently "registered" to a broken account with no profile: any retry
// with that email hit "already registered" -> signIn -> same phone clash ->
// blocked forever, needing manual support intervention.
//
// Only ever deletes the auth user when `isNewSignup` is true, i.e. THIS
// request is the one that just created it via auth.signUp() a moment earlier.
// When an existing account is being reused (email-duplicate -> signInWithPassword
// path in the client), isNewSignup is false and we never touch auth.users —
// that account existed before this request and isn't ours to delete.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let userId: string | undefined;
  let isNewSignup = false;

  try {
    const body = await req.json().catch(() => ({}));
    userId = body?.userId;
    isNewSignup = !!body?.isNewSignup;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const {
      phone,
      linkToken,
      email,
      name,
      nickname,
      country,
      currency,
      language,
      timezone,
      plan,
      isFreePlan,
      channel,
    } = body || {};

    // Same "reuse a pending, not-yet-linked token" protection the register
    // page used to do client-side — kept here so an in-flight Telegram link
    // (or a Lemon Squeezy tab with the old token baked into redirect_url)
    // doesn't get silently invalidated by a retried submit.
    let finalLinkToken = linkToken;
    if (channel === "telegram") {
      const { data: existingRow } = await supabaseAdmin
        .from("users")
        .select("link_token, telegram_chat_id")
        .eq("id", userId)
        .maybeSingle();

      if (existingRow?.link_token && !existingRow.telegram_chat_id) {
        finalLinkToken = existingRow.link_token;
      }
    }

    const { error: dbError } = await supabaseAdmin
      .from("users")
      .upsert(
        [
          {
            id: userId,
            phone_number: phone || null,
            link_token: finalLinkToken,
            email: typeof email === "string" ? email.trim().toLowerCase() : email,
            name,
            nickname: nickname || name,
            country,
            currency,
            language,
            timezone,
            plan: plan?.toUpperCase() === "FREE" ? "LITE" : plan?.toUpperCase(),
            payment_status: isFreePlan ? "PAID" : "PENDING",
            is_active: isFreePlan ? true : false,
            trial_ends_at:
              isFreePlan && channel === "whatsapp"
                ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                : null,
          },
        ],
        { onConflict: "id" }
      );

    if (dbError) {
      console.error("finalize-registration upsert error:", dbError);

      // ROLLBACK: this request itself just created a brand-new auth user a
      // moment ago via auth.signUp(), and the profile write for it failed.
      // Delete it so the email is never left stuck to a broken account.
      if (isNewSignup) {
        const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteErr) {
          // Rollback itself failed — log loudly so this doesn't go unnoticed,
          // but still tell the user the truth (their account wasn't created)
          // rather than pretending the rollback worked.
          console.error("finalize-registration rollback FAILED — orphaned auth user:", userId, deleteErr);
        }
      }

      if (dbError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "This WhatsApp number or email is already registered with another account. Please use a different number, or log in with the original email.",
            rolledBack: isNewSignup,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to save your profile: " + dbError.message, rolledBack: isNewSignup },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, linkToken: finalLinkToken });
  } catch (error: any) {
    console.error("finalize-registration route error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
