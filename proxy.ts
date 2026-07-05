import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ─── Constants ────────────────────────────────────────────────────────────────

const COOKIE_ACCESS = "access_token";
const COOKIE_REFRESH = "refresh_token";
const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";

// Encode secrets as Uint8Array for jose
function getSecret(key: string) {
  return new TextEncoder().encode(process.env[key] ?? "");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function verifyAccess(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret("JWT_ACCESS_SECRET"));
    return payload as { sub: string; role: string };
  } catch {
    return null;
  }
}

async function verifyRefresh(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret("JWT_REFRESH_SECRET"));
    return payload as { sub: string; role: string };
  } catch {
    return null;
  }
}

// ─── Proxy ────────────────────────────────────────────────────────────────────

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get(COOKIE_ACCESS)?.value;
  const refreshToken = req.cookies.get(COOKIE_REFRESH)?.value;

  // ── Protect /dashboard/* ───────────────────────────────────────────────────
  if (pathname.startsWith(DASHBOARD_PATH)) {
    // 1. Try access token
    if (accessToken) {
      const payload = await verifyAccess(accessToken);
      if (payload?.role === "admin") {
        // Valid — inject user id header for downstream use
        const res = NextResponse.next();
        res.headers.set("x-user-id", payload.sub);
        return res;
      }
    }

    // 2. Access token missing/expired — try silent refresh
    if (refreshToken) {
      const payload = await verifyRefresh(refreshToken);
      if (payload?.role === "admin") {
        // Issue new access token via internal refresh endpoint
        const refreshUrl = new URL("/api/auth/refresh", req.url);
        const refreshRes = await fetch(refreshUrl, {
          method: "POST",
          headers: { Cookie: `${COOKIE_REFRESH}=${refreshToken}` },
        });

        if (refreshRes.ok) {
          const newCookieHeader = refreshRes.headers.get("Set-Cookie");
          const res = NextResponse.next();
          res.headers.set("x-user-id", payload.sub);
          if (newCookieHeader) res.headers.set("Set-Cookie", newCookieHeader);
          return res;
        }
      }
    }

    // 3. Not authenticated → redirect to login
    const loginUrl = new URL(LOGIN_PATH, req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Protect /api/admin/* ───────────────────────────────────────────────────
  if (pathname.startsWith("/api/admin")) {
    if (accessToken) {
      const payload = await verifyAccess(accessToken);
      if (payload?.role === "admin") {
        const res = NextResponse.next();
        res.headers.set("x-user-id", payload.sub);
        return res;
      }
    }
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // ── Redirect already-authed users away from /login ────────────────────────
  if (pathname === LOGIN_PATH || pathname === "/") {
    if (accessToken) {
      const payload = await verifyAccess(accessToken);
      if (payload?.role === "admin") {
        return NextResponse.redirect(new URL(DASHBOARD_PATH, req.url));
      }
    }
  }

  return NextResponse.next();
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/login",
  ],
};
