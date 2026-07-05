import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { verifyPassword } from "@/lib/password";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import { LoginSchema } from "@/lib/validation/auth.schema";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/auth";

const ACCESS_MAX_AGE = 15 * 60; // 15 minutes in seconds
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    // Fetch user — password is select:false so must be explicit
    const user = await User.findOne({ email }).select("+password").lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    const tokenPayload = { sub: user._id.toString(), role: user.role as "admin" };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const isProd = process.env.NODE_ENV === "production";
    const cookieBase = `httpOnly; SameSite=Strict; Path=/; ${isProd ? "Secure;" : ""}`;

    const res = NextResponse.json({
      success: true,
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });

    res.headers.append(
      "Set-Cookie",
      `${COOKIE_ACCESS}=${accessToken}; Max-Age=${ACCESS_MAX_AGE}; ${cookieBase}`,
    );
    res.headers.append(
      "Set-Cookie",
      `${COOKIE_REFRESH}=${refreshToken}; Max-Age=${REFRESH_MAX_AGE}; ${cookieBase} Path=/api/auth/refresh`,
    );

    return res;
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.flatten().fieldErrors },
        { status: 422 },
      );
    }
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 },
    );
  }
}
