import type { NextRequest } from "next/server";
import { ZodError, z } from "zod";

import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { verifyPassword } from "@/lib/password";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { LoginSchema } from "@/lib/validation/auth.schema";
import {
  buildAuthTokens,
  serializeAuthResponse,
  setAuthCookies,
} from "@/lib/auth";
import { apiError, apiForbidden, apiSuccess, handleRouteError } from "@/lib/api/response";

/**
 * POST /api/auth/login
 *
 * Web: sets httpOnly cookies automatically.
 * Mobile: read accessToken + refreshToken from response body.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    const user = await User.findOne({ email }).select("+password").lean();

    if (!user) {
      return apiError("UNAUTHORIZED", "Invalid email or password.", 401);
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return apiError("UNAUTHORIZED", "Invalid email or password.", 401);
    }

    if (user.role !== "admin") {
      return apiForbidden("Access denied.");
    }

    const tokenPayload = { sub: user._id.toString(), role: user.role as "admin" };
    const tokens = buildAuthTokens(
      signAccessToken(tokenPayload),
      signRefreshToken(tokenPayload),
    );

    const res = apiSuccess(
      serializeAuthResponse(
        { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
        tokens,
      ),
      { message: "Login successful." },
    );

    setAuthCookies(res, tokens);
    return res;
  } catch (err) {
    if (err instanceof ZodError) {
      return apiError("VALIDATION_ERROR", "Validation failed.", 422, err.flatten().fieldErrors);
    }
    return handleRouteError(err, "[POST /api/auth/login]");
  }
}
