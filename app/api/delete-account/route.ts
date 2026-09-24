import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// -----------------------------------------------------------------------
// GDPR "right to erasure" / CCPA "right to delete" self-service endpoint.
// Deletes everything BroFInAi holds for the authenticated user: their
// transactions, budgets, bot session state, usage counters, any pending
// password-reset OTP, their uploaded avatar, and finally their account
// (both the `users` row and the Supabase Auth identity).
//
// This is destructive and irreversible, so the dashboard requires the user
// to type a literal "DELETE" confirmation before calling this — see the
// "Danger Zone" card in the Settings tab of app/dashboard/page.tsx.
// -----------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("phone_number, telegram_chat_id, email")
      .eq("id", user.id)
      .single();

    const phone = userRow?.phone_number as string | null | undefined;
    const chatId = userRow?.telegram_chat_id as string | null | undefined;
    const email = (userRow?.email as string | null | undefined) || user.email;

    // 1. Financial data
    await supabaseAdmin.from("transactions").delete().eq("user_id", user.id);
    await supabaseAdmin.from("budgets").delete().eq("user_id", user.id);

    // 2. Bot session state & usage counters — keyed by phone_number
    //    (WhatsApp) and/or telegram_chat_id, not user_id, so both need
    //    clearing independently whichever channel(s) the user connected.
    if (phone) {
      await supabaseAdmin.from("user_sessions").delete().eq("phone_number", phone);
      await supabaseAdmin.from("monthly_usage").delete().eq("phone_number", phone);
    }
    if (chatId) {
      await supabaseAdmin.from("user_sessions").delete().eq("telegram_chat_id", chatId);
      await supabaseAdmin.from("monthly_usage").delete().eq("telegram_chat_id", chatId);
    }

    // 3. Any pending password-reset OTP
    if (email) {
      await supabaseAdmin.from("password_resets").delete().eq("email", email);
    }

    // 4. Best-effort avatar cleanup (filenames are `{sanitized-email}-{ts}.ext`
    //    under avatars/, so list-and-match rather than guessing the exact name).
    if (email) {
      const prefix = email.replace(/[^a-zA-Z0-9]/g, "_");
      const { data: files } = await supabaseAdmin.storage.from("profiles").list("avatars");
      const toRemove = (files || [])
        .filter((f) => f.name.startsWith(prefix))
        .map((f) => `avatars/${f.name}`);
      if (toRemove.length > 0) {
        await supabaseAdmin.storage.from("profiles").remove(toRemove);
      }
    }

    // 5. The account row itself
    await supabaseAdmin.from("users").delete().eq("id", user.id);

    // 6. The Supabase Auth identity — last, so a failure above still leaves
    //    an inspectable users row rather than an orphaned auth user.
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (authDeleteError) {
      console.error("Auth user delete error:", authDeleteError);
      return NextResponse.json(
        { error: "Your data was deleted, but the login itself couldn't be removed. Contact support@brofinai.com to finish this." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
