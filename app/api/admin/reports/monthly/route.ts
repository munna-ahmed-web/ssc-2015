import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { Contribution, Member } from "@/models";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/reports/monthly
 * Query: periodLabel (required)
 *
 * Returns:
 *  - summary: totalCollected, paidCount, defaultersCount, activeCount, collectionRate
 *  - breakdown: per-member row (paid/unpaid, amount, date)
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const periodLabel = searchParams.get("periodLabel");

    if (!periodLabel) {
      return NextResponse.json(
        { success: false, error: "periodLabel query param is required" },
        { status: 400 },
      );
    }

    // All active members
    const activeMembers = await Member.find({ status: "active" })
      .select("_id fullName memberCode phone contributionType contributionAmount joinedAt")
      .sort({ memberCode: 1 })
      .lean();

    // All non-reversal contributions for this period
    const contributions = await Contribution.find({
      periodLabel,
      isReversal: false,
    })
      .select("memberId amount paidAt notes")
      .lean();

    // Build a map: memberId → contribution
    const paidMap = new Map(contributions.map((c) => [c.memberId.toString(), c]));

    // Per-member breakdown
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
        actualAmount: paid?.amount ?? null,
        paidAt: paid?.paidAt ?? null,
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

    return NextResponse.json({
      success: true,
      data: {
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
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/admin/reports/monthly]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
