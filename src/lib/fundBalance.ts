/**
 * Fund balance — the single source of truth for "how much money does the
 * foundation actually have available".
 *
 *   availableBalance = netContributions
 *                    − currentlyInvested                  (active principal out working)
 *                    + investmentNetResult                (closed: returned − principal − external allocations)
 *
 * FUTURE (money-lending system — interest-free loans to members/institutions):
 * add ONE aggregate here computing `outstandingLoanPrincipal` (Σ disbursed −
 * Σ recovered), add the field to FundBalanceBreakdown, and subtract it in
 * `availableBalance`. Every consumer reads this breakdown object, so no other
 * code changes. Do not fork balance math anywhere else.
 */

import { connectDB } from "@/lib/db";
import { Contribution, Investment } from "@/models";

export interface FundBalanceBreakdown {
  /** Σ contributions, reversal-aware (payments minus reversals) */
  netContributions: number;
  /** Σ principal of active investments (money currently out working) */
  currentlyInvested: number;
  /** Σ over closed investments: returnedAmount − principal − Σ external allocations */
  investmentNetResult: number;
  /** Σ over closed investments with profit: returnedAmount − principal */
  totalProfitEarned: number;
  /** Σ over closed investments with loss: principal − returnedAmount (positive number) */
  totalLossIncurred: number;
  /** Σ of all profit allocations that left the fund (social work, expenses, …) */
  totalExternallyAllocated: number;
  /** What the foundation can spend or invest right now */
  availableBalance: number;
}

export async function getFundBalance(): Promise<FundBalanceBreakdown> {
  await connectDB();

  const [contributionAgg, investmentAgg] = await Promise.all([
    Contribution.aggregate([
      {
        $group: {
          _id: null,
          net: { $sum: { $cond: ["$isReversal", { $multiply: ["$amount", -1] }, "$amount"] } },
        },
      },
    ]),
    Investment.aggregate([
      { $match: { status: { $in: ["active", "closed"] } } },
      {
        $project: {
          status: 1,
          principal: 1,
          returnedAmount: 1,
          allocTotal: { $sum: "$profitAllocations.amount" },
        },
      },
      {
        $group: {
          _id: "$status",
          principalTotal: { $sum: "$principal" },
          returnedTotal: { $sum: { $ifNull: ["$returnedAmount", 0] } },
          allocatedTotal: { $sum: "$allocTotal" },
          profitTotal: {
            $sum: {
              $max: [{ $subtract: [{ $ifNull: ["$returnedAmount", 0] }, "$principal"] }, 0],
            },
          },
          lossTotal: {
            $sum: {
              $max: [{ $subtract: ["$principal", { $ifNull: ["$returnedAmount", 0] }] }, 0],
            },
          },
        },
      },
    ]),
  ]);

  const netContributions = contributionAgg[0]?.net ?? 0;

  const active = investmentAgg.find((g) => g._id === "active");
  const closed = investmentAgg.find((g) => g._id === "closed");

  const currentlyInvested = active?.principalTotal ?? 0;
  const investmentNetResult = closed
    ? closed.returnedTotal - closed.principalTotal - closed.allocatedTotal
    : 0;

  return {
    netContributions,
    currentlyInvested,
    investmentNetResult,
    totalProfitEarned: closed?.profitTotal ?? 0,
    totalLossIncurred: closed?.lossTotal ?? 0,
    totalExternallyAllocated: closed?.allocatedTotal ?? 0,
    availableBalance: netContributions - currentlyInvested + investmentNetResult,
  };
}
