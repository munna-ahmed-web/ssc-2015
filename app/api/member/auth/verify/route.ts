import crypto from "node:crypto";

import type { NextRequest } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { Member, MemberLoginToken } from "@/models";
import { signMemberToken } from "@/lib/jwt";
import { COOKIE_MEMBER, MEMBER_MAX_AGE } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

const VerifySchema = z.object({
  token: z.string().regex(/^[0-9a-f]{64}$/, "Invalid token format"),
});

/**
 * POST /api/member/auth/verify — public.
 *
 * Body: { token } (raw token from the emailed magic link).
 * Marks the token used atomically (single-use), then sets the long-lived
 * member session as an httpOnly cookie.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const parsed = VerifySchema.safeParse(await req.json());
    if (!parsed.success) {
      return apiError("BAD_REQUEST", "This login link is invalid.", 400);
    }

    const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");

    // Atomic claim: only one request can ever flip usedAt on a given token
    const loginToken = await MemberLoginToken.findOneAndUpdate(
      { tokenHash, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
    ).lean();

    if (!loginToken) {
      return apiError("UNAUTHORIZED", "This login link is invalid or has expired.", 401);
    }

    const member = await Member.findOne({ _id: loginToken.memberId, status: "active" })
      .select("fullName memberCode")
      .lean();
    if (!member) {
      return apiError("UNAUTHORIZED", "This member account is not active.", 401);
    }

    const sessionToken = signMemberToken(member._id.toString());

    const res = apiSuccess(
      { fullName: member.fullName, memberCode: member.memberCode },
      { message: "Login successful." },
    );
    res.cookies.set(COOKIE_MEMBER, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MEMBER_MAX_AGE,
    });
    return res;
  } catch (err) {
    return handleRouteError(err, "[POST /api/member/auth/verify]");
  }
}
