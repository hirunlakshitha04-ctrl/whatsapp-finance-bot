import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ORIGINS = new Set(
  (process.env.NEXT_PUBLIC_ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_WEBSITE_URL || "https://brofinai.com")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean)
);

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const origin = req.headers.get("origin");

  // Restrict browser CORS to the app's own origin. Requests without an Origin
  // header (webhooks, server-to-server calls, same-origin navigation) are not
  // blocked by CORS.
  if (req.nextUrl.pathname.startsWith("/api/") && origin) {
    if (PUBLIC_ORIGINS.has(origin)) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Vary", "Origin");
      res.headers.set("Access-Control-Allow-Credentials", "true");
      res.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    }
  }

  if (req.method === "OPTIONS" && req.nextUrl.pathname.startsWith("/api/")) {
    if (!PUBLIC_ORIGINS.has(origin || "")) return new NextResponse(null, { status: 403 });
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
