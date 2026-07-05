import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verifyRefreshToken, signAccessToken } from "@/lib/jwt";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/auth";

const ACCESS_MAX_AGE = 15 * 60;

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(COOKIE_REFRESH)?.value;
    if (!refreshToken) {
      return NextResponse.json({ success: false, error: "No refresh token" }, { status: 401 });
    }

    const payload = verifyRefreshToken(refreshToken);
    const newAccessToken = signAccessToken({ sub: payload.sub, role: payload.role });

    const isProd = process.env.NODE_ENV === "production";
    const res = NextResponse.json({ success: true });
    res.headers.set(
      "Set-Cookie",
      `${COOKIE_ACCESS}=${newAccessToken}; Max-Age=${ACCESS_MAX_AGE}; httpOnly; SameSite=Strict; Path=/${isProd ? "; Secure" : ""}`,
    );
    return res;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid refresh token" }, { status: 401 });
  }
}
