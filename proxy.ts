import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

import {
  COOKIE_REFRESH,
  getAccessTokenFromRequest,
} from "@/lib/auth/constants";

const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";

function getSecret(key: string) {
  return new TextEncoder().encode(process.env[key] ?? "");
}

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

function unauthorizedJson() {
  return NextResponse.json(
    {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Unauthorized." },
    },
    { status: 401 },
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = getAccessTokenFromRequest(req);
  const refreshToken = req.cookies.get(COOKIE_REFRESH)?.value;

  if (pathname.startsWith(DASHBOARD_PATH)) {
    if (accessToken) {
      const payload = await verifyAccess(accessToken);
      if (payload?.role === "admin") {
        const res = NextResponse.next();
        res.headers.set("x-user-id", payload.sub);
        return res;
      }
    }

    if (refreshToken) {
      const payload = await verifyRefresh(refreshToken);
      if (payload?.role === "admin") {
        const refreshUrl = new URL("/api/auth/refresh", req.url);
        const refreshRes = await fetch(refreshUrl, {
          method: "POST",
          headers: { Cookie: `${COOKIE_REFRESH}=${refreshToken}` },
        });

        if (refreshRes.ok) {
          const res = NextResponse.next();
          res.headers.set("x-user-id", payload.sub);

          const setCookies =
            typeof refreshRes.headers.getSetCookie === "function"
              ? refreshRes.headers.getSetCookie()
              : [];
          if (setCookies.length > 0) {
            for (const cookie of setCookies) {
              res.headers.append("Set-Cookie", cookie);
            }
          } else {
            const single = refreshRes.headers.get("Set-Cookie");
            if (single) res.headers.append("Set-Cookie", single);
          }

          return res;
        }
      }
    }

    const loginUrl = new URL(LOGIN_PATH, req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/api/admin")) {
    if (accessToken) {
      const payload = await verifyAccess(accessToken);
      if (payload?.role === "admin") {
        const res = NextResponse.next();
        res.headers.set("x-user-id", payload.sub);
        return res;
      }
    }
    return unauthorizedJson();
  }

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

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*", "/login"],
};
