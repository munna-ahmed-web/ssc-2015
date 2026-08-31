import crypto from "node:crypto";

import type { NextRequest } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { Member, MemberLoginToken } from "@/models";
import { sendMemberMagicLink } from "@/lib/email";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

const RequestSchema = z.object({
  identifier: z.string().min(3, "Enter your phone number or email").max(200).trim(),
});

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_HOUR = 3;

const GENERIC_MESSAGE =
  "If this matches a member of the foundation, a login link has been sent to their email.";

/**
 * POST /api/member/auth/request — public.
 *
 * Body: { identifier } (phone number or email).
 * Always answers with the same generic success message so outsiders cannot
 * probe who is a member. Rate-limited per member via recent token count.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Validation failed.",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const identifier = parsed.data.identifier;

    // Match by exact phone or lowercased email; only active members can log in
    const member = await Member.findOne({
      status: "active",
      $or: [{ phone: identifier }, { email: identifier.toLowerCase() }],
    })
      .select("fullName email")
      .lean();

    // Unknown identifier or member without email → same generic answer, no email
    if (!member?.email) {
      return apiSuccess(null, { message: GENERIC_MESSAGE });
    }

    // Rate limit: at most 3 link requests per member per hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await MemberLoginToken.countDocuments({
      memberId: member._id,
      createdAt: { $gt: hourAgo },
    });
    if (recentCount >= MAX_REQUESTS_PER_HOUR) {
      return apiError("BAD_REQUEST", "Too many login requests. Please try again later.", 429);
    }

    // Raw token lives only in the emailed link; store its hash
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await MemberLoginToken.create({
      tokenHash,
      memberId: member._id,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    });

    // Build the link from the request's own origin so it is automatically
    // correct in every environment (localhost in dev, the real domain in
    // production) with no env change needed on deploy.
    const baseUrl = req.nextUrl.origin;
    const url = `${baseUrl}/member/verify?token=${rawToken}`;
    await sendMemberMagicLink(member.email, member.fullName, url);

    return apiSuccess(null, { message: GENERIC_MESSAGE });
  } catch (err) {
    return handleRouteError(err, "[POST /api/member/auth/request]");
  }
}
