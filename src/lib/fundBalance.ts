/**
 * Fund balance — the single source of truth for "how much money does the
 * foundation actually have available".
 *
 *   availableBalance = netContributions
 *                    − currentlyInvested            (active investment principal, out working)
 *                    + investmentNetResult          (closed: returned − principal − external allocations)
 *                    − outstandingLoanPrincipal     (interest-free money lent, not yet repaid)
 *                    − totalLoansWrittenOff         (lent money accepted as unrecoverable)
 *
 * Loans are interest-free: the borrower repays exactly the principal, so a loan
 * never produces profit — only an outstanding balance while the money is out,
 * and a permanent reduction of the fund if it is written off.
 *
 * This is the single balance authority. Any future money-out feature should add
 * its aggregate here rather than forking the math elsewhere.
 */

import { connectDB } from "@/lib/db";
import { Contribution, Investment, Loan } from "@/models";

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
  /** Σ principal still owed on active loans (lent out, not yet repaid) */
  outstandingLoanPrincipal: number;
  /** Σ unrecovered principal on written-off loans (permanently lost) */
  totalLoansWrittenOff: number;
  /** Σ repayments received across all loans */
  totalLoanRepaid: number;
  /** What the foundation can spend, invest or lend right now */
  availableBalance: number;
}

export async function getFundBalance(): Promise<FundBalanceBreakdown> {
  await connectDB();

  const [contributionAgg, investmentAgg, loanAgg] = await Promise.all([
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
    Loan.aggregate([
      { $match: { status: { $in: ["active", "recovered", "written_off"] } } },
      {
        $project: {
          status: 1,
          principal: 1,
          repaidTotal: { $sum: "$repayments.amount" },
        },
      },
      {
        $group: {
          _id: "$status",
          principalTotal: { $sum: "$principal" },
          repaidTotal: { $sum: "$repaidTotal" },
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

  const activeLoans = loanAgg.find((g) => g._id === "active");
  const recoveredLoans = loanAgg.find((g) => g._id === "recovered");
  const writtenOffLoans = loanAgg.find((g) => g._id === "written_off");

  // Active loans: only the not-yet-repaid part is still out of the fund
  const outstandingLoanPrincipal = activeLoans
    ? activeLoans.principalTotal - activeLoans.repaidTotal
    : 0;
  // Written off: whatever was never repaid is gone for good
  const totalLoansWrittenOff = writtenOffLoans
    ? writtenOffLoans.principalTotal - writtenOffLoans.repaidTotal
    : 0;
  const totalLoanRepaid =
    (activeLoans?.repaidTotal ?? 0) +
    (recoveredLoans?.repaidTotal ?? 0) +
    (writtenOffLoans?.repaidTotal ?? 0);

  return {
    netContributions,
    currentlyInvested,
    investmentNetResult,
    totalProfitEarned: closed?.profitTotal ?? 0,
    totalLossIncurred: closed?.lossTotal ?? 0,
    totalExternallyAllocated: closed?.allocatedTotal ?? 0,
    outstandingLoanPrincipal,
    totalLoansWrittenOff,
    totalLoanRepaid,
    availableBalance:
      netContributions -
      currentlyInvested +
      investmentNetResult -
      outstandingLoanPrincipal -
      totalLoansWrittenOff,
  };
}
