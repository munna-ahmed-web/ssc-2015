import type { NextRequest } from "next/server";

import { connectDB } from "@/lib/db";
import { Contribution, Member } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

/**
 * GET /api/admin/contributions/defaulters
 * Query: periodLabel (required)
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const periodLabel = searchParams.get("periodLabel");

    if (!periodLabel) {
      return apiError("BAD_REQUEST", "periodLabel query param is required.", 400);
    }

    const activeMembers = await Member.find({ status: "active" })
      .select("_id fullName memberCode phone contributionType contributionAmount")
      .lean();

    const paidContributions = await Contribution.find({
      periodLabel,
      isReversal: false,
    })
      .select("memberId")
      .lean();

    const paidSet = new Set(paidContributions.map((c) => c.memberId.toString()));
    const defaulters = activeMembers.filter((m) => !paidSet.has(m._id.toString()));

    return apiSuccess(defaulters, {
      meta: { periodLabel, total: defaulters.length },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/contributions/defaulters]");
  }
}
