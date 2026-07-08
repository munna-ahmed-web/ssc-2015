import type { NextRequest, NextResponse } from "next/server";
export const COOKIE_ACCESS = "client_access_token";
export const COOKIE_REFRESH = "client_refresh_token";

/** Access token lifetime in seconds (15 minutes). */
export const ACCESS_MAX_AGE = 15 * 60;

/** Refresh token lifetime in seconds (7 days). */
export const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export function parseBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

/** Read access token from Authorization header or cookie (middleware / edge-safe). */
export function getAccessTokenFromRequest(req: NextRequest): string | undefined {
  const bearer = parseBearerToken(req.headers.get("authorization"));
  if (bearer) return bearer;
  return req.cookies.get(COOKIE_ACCESS)?.value;
}

/** Attach httpOnly auth cookies to a response (web clients). */
export function setAuthCookies(_res: NextResponse, _tokens: AuthTokens): void {
  // Disabled: Relying entirely on client-managed Bearer headers
}

/** Clear httpOnly auth cookies. */
export function clearAuthCookies(_res: NextResponse): void {
  // Disabled: Relying entirely on client-managed Bearer headers
}

export function buildAuthTokens(accessToken: string, refreshToken: string): AuthTokens {
  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_MAX_AGE,
    refreshExpiresIn: REFRESH_MAX_AGE,
  };
}

export function serializeAuthResponse(
  user: { id: string; name: string; email: string; role: string },
  tokens: AuthTokens,
) {
  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    refreshExpiresIn: tokens.refreshExpiresIn,
  };
}
