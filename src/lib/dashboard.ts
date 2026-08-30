import { connectDB } from "@/lib/db";
import { MembershipApplication, Member, Contribution } from "@/models";
import { getPeriodLabel } from "@/types";

export interface DashboardStats {
  pendingApplications: number;
  activeMembers: number;
  totalCollectedThisPeriod: number;
  totalCollectedAllTime: number;
  defaultersCount: number;
  currentPeriodLabel: string;
}

/**
 * Fetches all 4 dashboard stat counts in parallel.
 * Called server-side from the dashboard overview page.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB();

  // Determine current period label based on the most common contribution type
  // Default to monthly for the stats view
  const currentPeriodLabel = getPeriodLabel("monthly");

  const [
    pendingApplications,
    activeMembers,
    periodContributions,
    allTimeContributions,
    activeMemberIds,
  ] = await Promise.all([
    // Pending applications count
    MembershipApplication.countDocuments({ status: "pending" }),

    // Active members count
    Member.countDocuments({ status: "active" }),

    // Net collected for current period (payments minus reversals; members can
    // pay multiple times per period)
    Contribution.aggregate([
      {
        $match: {
          periodLabel: currentPeriodLabel,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: { $cond: ["$isReversal", { $multiply: ["$amount", -1] }, "$amount"] },
          },
          memberIds: { $addToSet: { $cond: ["$isReversal", null, "$memberId"] } },
        },
      },
    ]),

    // All-time net collected across every period (payments minus reversals)
    Contribution.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: { $cond: ["$isReversal", { $multiply: ["$amount", -1] }, "$amount"] },
          },
        },
      },
    ]),

    // Get all active member IDs for defaulter count
    Member.find({ status: "active" }).select("_id").lean(),
  ]);

  // Defaulters = active members who have NO confirmed contribution this period
  const paidMemberIds = (periodContributions[0]?.memberIds ?? []).filter(Boolean);
  const allActiveMemberIds = activeMemberIds.map((m) => m._id.toString());
  const paidSet = new Set(paidMemberIds.map((id: { toString(): string }) => id.toString()));
  const defaultersCount = allActiveMemberIds.filter((id) => !paidSet.has(id)).length;

  return {
    pendingApplications,
    activeMembers,
    totalCollectedThisPeriod: periodContributions[0]?.total ?? 0,
    totalCollectedAllTime: allTimeContributions[0]?.total ?? 0,
    defaultersCount,
    currentPeriodLabel,
  };
}
