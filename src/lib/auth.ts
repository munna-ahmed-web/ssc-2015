/**
 * Server-side auth helpers for Route Handlers and Server Components.
 * Uses jsonwebtoken (Node.js runtime only — NOT for middleware.ts).
 */

import { cookies } from "next/headers";

import { verifyAccessToken, type TokenPayload } from "@/lib/jwt";

export const COOKIE_ACCESS = "access_token";
export const COOKIE_REFRESH = "refresh_token";

/**
 * Reads and verifies the access_token cookie.
 * Returns the decoded payload or null if missing / invalid / expired.
 */
export async function getSessionUser(): Promise<TokenPayload | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_ACCESS)?.value;
    if (!token) return null;
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

/**
 * Like getSessionUser() but throws a 401 Response if not authenticated.
 * Use inside Route Handlers that require auth.
 */
export async function requireAdmin(): Promise<TokenPayload> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    throw new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
