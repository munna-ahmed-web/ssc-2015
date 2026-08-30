import { connectDB } from "@/lib/db";
import { Contribution, Member } from "@/models";
import { requireMember } from "@/lib/auth";
import { getPeriodLabel } from "@/types";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

/**
 * GET /api/member/stats — member session required.
 * Shareable foundation aggregates only: collected this month, collected all
 * time (both net of reversals) and the active member count. No defaulter,
 * application, or per-member data is exposed here.
 */
export async function GET() {
  try {
    await requireMember();
    await connectDB();

    const currentPeriodLabel = getPeriodLabel("monthly");

    const [activeMembers, periodAgg, allTimeAgg] = await Promise.all([
      Member.countDocuments({ status: "active" }),
      Contribution.aggregate([
        { $match: { periodLabel: currentPeriodLabel } },
        {
          $group: {
            _id: null,
            net: { $sum: { $cond: ["$isReversal", { $multiply: ["$amount", -1] }, "$amount"] } },
          },
        },
      ]),
      Contribution.aggregate([
        {
          $group: {
            _id: null,
            net: { $sum: { $cond: ["$isReversal", { $multiply: ["$amount", -1] }, "$amount"] } },
          },
        },
      ]),
    ]);

    return apiSuccess({
      currentPeriodLabel,
      activeMembers,
      collectedThisPeriod: periodAgg[0]?.net ?? 0,
      collectedAllTime: allTimeAgg[0]?.net ?? 0,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/member/stats]");
  }
}
