import { connectDB } from "@/lib/db";
import { Contribution, Member } from "@/models";
import { requireMember } from "@/lib/auth";
import { getPeriodLabel } from "@/types";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

/**
 * GET /api/member/stats — member session required.
 *
 * Shareable foundation aggregates only: net collected this month / all time,
 * active member count, how many members have paid this period (count only —
 * never names), and a 6-month collection trend. No defaulter names,
 * application data, or per-member figures are exposed.
 */
export async function GET() {
  try {
    await requireMember();
    await connectDB();

    const currentPeriodLabel = getPeriodLabel("monthly");

    // Last 6 monthly period labels, oldest first
    const trendLabels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1); // avoid month-length rollover (e.g. 31st → skipped month)
      d.setMonth(d.getMonth() - i);
      trendLabels.push(getPeriodLabel("monthly", d));
    }

    const [activeMembers, allTimeAgg, trendAgg, periodRows, periodReversals] = await Promise.all([
      Member.countDocuments({ status: "active" }),
      Contribution.aggregate([
        {
          $group: {
            _id: null,
            net: { $sum: { $cond: ["$isReversal", { $multiply: ["$amount", -1] }, "$amount"] } },
          },
        },
      ]),
      Contribution.aggregate([
        { $match: { periodLabel: { $in: trendLabels } } },
        {
          $group: {
            _id: "$periodLabel",
            net: { $sum: { $cond: ["$isReversal", { $multiply: ["$amount", -1] }, "$amount"] } },
          },
        },
      ]),
      Contribution.find({ periodLabel: currentPeriodLabel, isReversal: false })
        .select("memberId")
        .lean(),
      Contribution.find({ periodLabel: currentPeriodLabel, isReversal: true })
        .select("reversalOf")
        .lean(),
    ]);

    const trendMap = new Map<string, number>(trendAgg.map((t) => [t._id as string, t.net]));
    const monthlyTrend = trendLabels.map((label) => ({
      periodLabel: label,
      total: trendMap.get(label) ?? 0,
    }));

    // Members counted as paid: at least one non-reversed payment this period
    const reversedIds = new Set(
      periodReversals.map((r) => r.reversalOf?.toString()).filter(Boolean),
    );
    const paidMemberIds = new Set(
      periodRows
        .filter((c) => !reversedIds.has(c._id.toString()))
        .map((c) => c.memberId.toString()),
    );

    return apiSuccess({
      currentPeriodLabel,
      activeMembers,
      paidMembersThisPeriod: paidMemberIds.size,
      collectedThisPeriod: trendMap.get(currentPeriodLabel) ?? 0,
      collectedAllTime: allTimeAgg[0]?.net ?? 0,
      monthlyTrend,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/member/stats]");
  }
}
