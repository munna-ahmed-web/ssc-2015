import { connectDB } from "@/lib/db";
import { MembershipApplication, Member, Contribution } from "@/models";
import { getPeriodLabel } from "@/types";

export interface DashboardStats {
  pendingApplications: number;
  activeMembers: number;
  totalCollectedThisPeriod: number;
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

  const [pendingApplications, activeMembers, periodContributions, activeMemberIds] =
    await Promise.all([
      // Pending applications count
      MembershipApplication.countDocuments({ status: "pending" }),

      // Active members count
      Member.countDocuments({ status: "active" }),

      // Sum of contributions for current period (non-reversals only)
      Contribution.aggregate([
        {
          $match: {
            periodLabel: currentPeriodLabel,
            isReversal: false,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            memberIds: { $addToSet: "$memberId" },
          },
        },
      ]),

      // Get all active member IDs for defaulter count
      Member.find({ status: "active" }).select("_id").lean(),
    ]);

  // Defaulters = active members who have NO confirmed contribution this period
  const paidMemberIds = periodContributions[0]?.memberIds ?? [];
  const allActiveMemberIds = activeMemberIds.map((m) => m._id.toString());
  const paidSet = new Set(paidMemberIds.map((id: { toString(): string }) => id.toString()));
  const defaultersCount = allActiveMemberIds.filter((id) => !paidSet.has(id)).length;

  return {
    pendingApplications,
    activeMembers,
    totalCollectedThisPeriod: periodContributions[0]?.total ?? 0,
    defaultersCount,
    currentPeriodLabel,
  };
}
