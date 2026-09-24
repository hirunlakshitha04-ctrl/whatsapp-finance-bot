import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(match[1]);

  if (error || !user) return null;
  return user;
}

export function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}
