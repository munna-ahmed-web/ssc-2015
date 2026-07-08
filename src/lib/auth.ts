/**
 * Server-side auth helpers for Route Handlers and Server Components.
 * Supports web (httpOnly cookies) and mobile/API (Authorization: Bearer).
 */

import { headers } from "next/headers";

import { verifyAccessToken, type TokenPayload } from "@/lib/jwt";
import { apiUnauthorized } from "@/lib/api/response";

import { parseBearerToken } from "./auth/constants";

export {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  ACCESS_MAX_AGE,
  REFRESH_MAX_AGE,
  buildAuthTokens,
  serializeAuthResponse,
  setAuthCookies,
  clearAuthCookies,
  getAccessTokenFromRequest,
  parseBearerToken,
} from "./auth/constants";
export type { AuthTokens } from "./auth/constants";

async function resolveAccessToken(): Promise<string | null> {
  const headerStore = await headers();
  return parseBearerToken(headerStore.get("authorization"));
}

/**
 * Reads access token from Bearer header or httpOnly cookie.
 * Returns the decoded payload or null if missing / invalid / expired.
 */
export async function getSessionUser(): Promise<TokenPayload | null> {
  try {
    const token = await resolveAccessToken();
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
    throw apiUnauthorized();
  }
  return user;
}
