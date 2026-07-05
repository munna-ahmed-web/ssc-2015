import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { Contribution, Member } from "@/models";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/contributions/defaulters
 * Query: periodLabel (required) — returns active members with no non-reversal contribution
 * for the given period.
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
      .select("_id fullName memberCode phone contributionType contributionAmount")
      .lean();

    // Members who HAVE paid for this period (not reversals)
    const paidContributions = await Contribution.find({
      periodLabel,
      isReversal: false,
    })
      .select("memberId")
      .lean();

    const paidSet = new Set(paidContributions.map((c) => c.memberId.toString()));

    // Defaulters = active members NOT in paidSet
    const defaulters = activeMembers.filter((m) => !paidSet.has(m._id.toString()));

    return NextResponse.json({
      success: true,
      data: defaulters,
      periodLabel,
      total: defaulters.length,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/admin/contributions/defaulters]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
