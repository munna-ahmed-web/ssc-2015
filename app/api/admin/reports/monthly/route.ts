import type { NextRequest } from "next/server";

import { connectDB } from "@/lib/db";
import { Contribution, Member } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

/**
 * GET /api/admin/reports/monthly
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
      .select("_id fullName memberCode phone contributionType contributionAmount joinedAt")
      .sort({ memberCode: 1 })
      .lean();

    // Members may pay multiple times per period with varying amounts.
    // Aggregate all non-reversed payments per member: total, count, last payment date.
    const [contributions, reversals] = await Promise.all([
      Contribution.find({ periodLabel, isReversal: false })
        .select("memberId amount paidAt notes")
        .lean(),
      Contribution.find({ periodLabel, isReversal: true }).select("reversalOf").lean(),
    ]);

    const reversedIds = new Set(reversals.map((r) => r.reversalOf?.toString()).filter(Boolean));

    const paidMap = new Map<
      string,
      { total: number; count: number; lastPaidAt: Date; notes: string | null }
    >();
    for (const c of contributions) {
      if (reversedIds.has(c._id.toString())) continue;
      const key = c.memberId.toString();
      const entry = paidMap.get(key);
      if (entry) {
        entry.total += c.amount;
        entry.count += 1;
        if (c.paidAt > entry.lastPaidAt) {
          entry.lastPaidAt = c.paidAt;
          entry.notes = c.notes ?? entry.notes;
        }
      } else {
        paidMap.set(key, {
          total: c.amount,
          count: 1,
          lastPaidAt: c.paidAt,
          notes: c.notes ?? null,
        });
      }
    }

    const breakdown = activeMembers.map((m) => {
      const paid = paidMap.get(m._id.toString());
      return {
        memberId: m._id.toString(),
        memberCode: m.memberCode,
        fullName: m.fullName,
        phone: m.phone,
        contributionType: m.contributionType,
        expectedAmount: m.contributionAmount,
        paid: !!paid,
        actualAmount: paid?.total ?? null,
        paymentsCount: paid?.count ?? 0,
        paidAt: paid?.lastPaidAt ?? null,
        notes: paid?.notes ?? null,
      };
    });

    const paidCount = breakdown.filter((r) => r.paid).length;
    const totalCollected = breakdown
      .filter((r) => r.paid)
      .reduce((sum, r) => sum + (r.actualAmount ?? 0), 0);
    const expectedTotal = breakdown.reduce((sum, r) => sum + r.expectedAmount, 0);
    const defaultersCount = breakdown.filter((r) => !r.paid).length;
    const collectionRate =
      activeMembers.length > 0 ? Math.round((paidCount / activeMembers.length) * 100) : 0;

    return apiSuccess({
      periodLabel,
      summary: {
        activeMembers: activeMembers.length,
        paidCount,
        defaultersCount,
        totalCollected,
        expectedTotal,
        collectionRate,
      },
      breakdown,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/reports/monthly]");
  }
}
