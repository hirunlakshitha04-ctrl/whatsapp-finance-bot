import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getBearerToken } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const part = token.split(".")[1];
    if (!part) return {};
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

function deviceName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  const browser = ua.includes("edg/") ? "Edge" : ua.includes("chrome/") ? "Chrome" : ua.includes("firefox/") ? "Firefox" : ua.includes("safari/") ? "Safari" : "Browser";
  const device = ua.includes("iphone") ? "iPhone" : ua.includes("ipad") ? "iPad" : ua.includes("android") ? "Android" : ua.includes("mac os") ? "Mac" : ua.includes("windows") ? "Windows" : ua.includes("linux") ? "Linux" : "Device";
  return `${browser} - ${device}`;
}

function getLocation(req: NextRequest) {
  const city = req.headers.get("x-vercel-ip-city") || "";
  const country = req.headers.get("x-vercel-ip-country") || "";
  return [city, country].filter(Boolean).join(", ") || "Unknown location";
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const token = getBearerToken(req);
    if (!user || !token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = decodeJwtPayload(token);
    const sessionId = typeof payload.session_id === "string" ? payload.session_id : typeof payload.sid === "string" ? payload.sid : null;
    if (!sessionId) return NextResponse.json({ error: "Session identifier unavailable" }, { status: 400 });

    const userAgent = req.headers.get("user-agent") || "Unknown device";
    const now = new Date().toISOString();
    const row = {
      user_id: user.id,
      session_id: sessionId,
      device_name: deviceName(userAgent),
      user_agent: userAgent.slice(0, 500),
      location_label: getLocation(req).slice(0, 120),
      last_active_at: now,
      updated_at: now,
    };

    const { error } = await supabaseAdmin.from("security_sessions").upsert(row, { onConflict: "user_id,session_id" });
    if (error) return NextResponse.json({ error: "Could not record session" }, { status: 500 });

    return NextResponse.json({ success: true, session_id: sessionId });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const token = getBearerToken(req);
    if (!user || !token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = decodeJwtPayload(token);
    const currentSessionId = typeof payload.session_id === "string" ? payload.session_id : typeof payload.sid === "string" ? payload.sid : null;

    const { data, error } = await supabaseAdmin
      .from("security_sessions")
      .select("id, session_id, device_name, location_label, last_active_at, created_at")
      .eq("user_id", user.id)
      .order("last_active_at", { ascending: false });

    if (error) return NextResponse.json({ error: "Could not load sessions" }, { status: 500 });
    return NextResponse.json({ sessions: (data || []).map((s) => ({ ...s, current: s.session_id === currentSessionId })) });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const token = getBearerToken(req);
    if (!user || !token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = decodeJwtPayload(token);
    const currentSessionId = typeof payload.session_id === "string" ? payload.session_id : typeof payload.sid === "string" ? payload.sid : null;
    if (!currentSessionId) return NextResponse.json({ error: "Session identifier unavailable" }, { status: 400 });

    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(token, "others");
    if (signOutError) return NextResponse.json({ error: "Could not log out other sessions" }, { status: 500 });

    await supabaseAdmin.from("security_sessions").delete().eq("user_id", user.id).neq("session_id", currentSessionId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
