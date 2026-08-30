import type { NextRequest } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { Contribution } from "@/models";
import { requireMember } from "@/lib/auth";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

/**
 * GET /api/member/me/contributions — member session required.
 * The logged-in member's own ledger rows (reversals included, labeled),
 * newest first, paginated, plus their net total paid.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireMember();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));

    const memberId = new mongoose.Types.ObjectId(session.sub);

    const [contributions, total, netAgg] = await Promise.all([
      Contribution.find({ memberId })
        .select("amount periodLabel paidAt isReversal reversalOf notes createdAt")
        .sort({ paidAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Contribution.countDocuments({ memberId }),
      Contribution.aggregate([
        { $match: { memberId } },
        {
          $group: {
            _id: null,
            net: { $sum: { $cond: ["$isReversal", { $multiply: ["$amount", -1] }, "$amount"] } },
          },
        },
      ]),
    ]);

    return apiSuccess(contributions, {
      meta: {
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        myTotalPaid: netAgg[0]?.net ?? 0,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/member/me/contributions]");
  }
}
