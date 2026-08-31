import type { NextRequest } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { Contribution, Member } from "@/models";
import { requireMember } from "@/lib/auth";
import { getPeriodLabel } from "@/types";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

/**
 * GET /api/member/me/contributions — member session required.
 *
 * The logged-in member's own ledger, newest first, paginated.
 * Query: page, limit, year (YYYY — filter by payment year),
 *        includeReversals ("false" hides reversal entries; default shown).
 *
 * Meta: pagination, myTotalPaid (net, all-time), paymentsCount, lastPaidAt,
 *       thisYearTotal, yearlyBreakdown, availableYears, currentPeriodLabel,
 *       currentPeriodPaid (based on the member's own weekly/monthly type).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireMember();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
    const yearRaw = searchParams.get("year");
    const year = yearRaw && /^\d{4}$/.test(yearRaw) ? parseInt(yearRaw) : null;
    const includeReversals = searchParams.get("includeReversals") !== "false";

    const memberId = new mongoose.Types.ObjectId(session.sub);

    const filter: Record<string, unknown> = { memberId };
    if (!includeReversals) filter.isReversal = false;
    if (year) {
      filter.paidAt = {
        $gte: new Date(Date.UTC(year, 0, 1)),
        $lt: new Date(Date.UTC(year + 1, 0, 1)),
      };
    }

    const [contributions, total, allRows, member] = await Promise.all([
      Contribution.find(filter)
        .select("amount periodLabel paidAt isReversal reversalOf notes createdAt")
        .sort({ paidAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Contribution.countDocuments(filter),
      // Full (unfiltered) history for the summary numbers — small per member
      Contribution.find({ memberId })
        .select("amount paidAt periodLabel isReversal reversalOf")
        .lean(),
      Member.findById(memberId).select("contributionType").lean(),
    ]);

    // Reversal-aware summaries over the member's whole history
    const reversedIds = new Set(
      allRows.filter((r) => r.isReversal && r.reversalOf).map((r) => String(r.reversalOf)),
    );
    const effective = allRows.filter((r) => !r.isReversal && !reversedIds.has(String(r._id)));

    const myTotalPaid = allRows.reduce((sum, r) => sum + (r.isReversal ? -r.amount : r.amount), 0);

    const nowYear = new Date().getFullYear();
    const yearlyTotals = new Map<number, number>();
    for (const r of effective) {
      const y = new Date(r.paidAt).getFullYear();
      yearlyTotals.set(y, (yearlyTotals.get(y) ?? 0) + r.amount);
    }
    const yearlyBreakdown = [...yearlyTotals.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([y, totalPaid]) => ({ year: y, total: totalPaid }));

    const lastPaidAt =
      effective.length > 0
        ? effective.reduce((max, r) => (r.paidAt > max ? r.paidAt : max), effective[0].paidAt)
        : null;

    const currentPeriodLabel = getPeriodLabel(member?.contributionType ?? "monthly");
    const currentPeriodPaid = effective.some((r) => r.periodLabel === currentPeriodLabel);

    return apiSuccess(contributions, {
      meta: {
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        myTotalPaid,
        paymentsCount: effective.length,
        lastPaidAt,
        thisYearTotal: yearlyTotals.get(nowYear) ?? 0,
        yearlyBreakdown,
        availableYears: yearlyBreakdown.map((y) => y.year),
        currentPeriodLabel,
        currentPeriodPaid,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/member/me/contributions]");
  }
}
