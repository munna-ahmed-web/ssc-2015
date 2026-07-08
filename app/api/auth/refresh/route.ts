import type { NextRequest } from "next/server";
import { z } from "zod";

import { verifyRefreshToken, signAccessToken } from "@/lib/jwt";
import { buildAuthTokens, setAuthCookies } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api/response";

const RefreshBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

/**
 * POST /api/auth/refresh
 *
 * Web: send refresh token via httpOnly cookie (empty body ok).
 * Mobile: send { "refreshToken": "..." } in JSON body.
 */
export async function POST(req: NextRequest) {
  try {
    let refreshToken = null;

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const raw = await req.json().catch(() => ({}));
      const parsed = RefreshBodySchema.safeParse(raw);
      if (parsed.success && parsed.data.refreshToken) {
        refreshToken = parsed.data.refreshToken;
      }
    }

    if (!refreshToken) {
      return apiError("UNAUTHORIZED", "Refresh token is required.", 401);
    }

    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });
    const tokens = buildAuthTokens(accessToken, refreshToken);

    const res = apiSuccess(
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        refreshExpiresIn: tokens.refreshExpiresIn,
      },
      { message: "Token refreshed." },
    );

    setAuthCookies(res, tokens);
    return res;
  } catch {
    return apiError("UNAUTHORIZED", "Invalid or expired refresh token.", 401);
  }
}
