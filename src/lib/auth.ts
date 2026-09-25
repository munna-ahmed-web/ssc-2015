/**
 * Server-side auth helpers for Route Handlers and Server Components.
 * Supports web (httpOnly cookies) and mobile/API (Authorization: Bearer).
 */

import { cookies, headers } from "next/headers";

import { verifyAccessToken, type TokenPayload } from "@/lib/jwt";
import { apiForbidden, apiUnauthorized } from "@/lib/api/response";

import { parseBearerToken } from "./auth/constants";

/** httpOnly cookie holding the member-portal session token. */
export const COOKIE_MEMBER = "member_token";

/** Member-portal session cookie lifetime in seconds (keep in sync with JWT_MEMBER_EXPIRES_IN). */
export const MEMBER_MAX_AGE = 60 * 60; // 1 hour

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
 * Like getSessionUser() but throws a Response if not authenticated.
 * Use inside Route Handlers that require auth.
 *
 * A signed-in non-admin gets 403, not 401 — a 401 would send the client into a
 * token refresh and a /login redirect that cannot fix a role problem, and the
 * admin would never see why the action was refused.
 */
export async function requireAdmin(): Promise<TokenPayload> {
  const user = await getSessionUser();
  if (!user) {
    throw apiUnauthorized("Your session has expired. Please sign in again.");
  }
  if (user.role !== "admin") {
    throw apiForbidden("This action requires an administrator account.");
  }
  return user;
}

/**
 * Member-portal auth guard. Reads the member session from the `member_token`
 * httpOnly cookie (web) or a Bearer header (mobile), and requires role
 * "member" — admin tokens are NOT accepted here, and member tokens are never
 * accepted by requireAdmin(). `sub` is the Member _id.
 * Throws a 401 Response if not authenticated.
 */
export async function requireMember(): Promise<TokenPayload> {
  try {
    const bearer = await resolveAccessToken();
    const cookieStore = await cookies();
    const token = bearer ?? cookieStore.get(COOKIE_MEMBER)?.value;
    if (!token) throw apiUnauthorized("Please sign in to view your member portal.");

    const payload = verifyAccessToken(token);
    if (payload.role !== "member") {
      throw apiForbidden("This area is for member accounts only.");
    }
    return payload;
  } catch (err) {
    if (err instanceof Response) throw err;
    throw apiUnauthorized("Your member session has expired. Please sign in again.");
  }
}
