/**
 * Club room money — completely separate from the foundation fund.
 *
 * The club room is a shared space with its own monthly costs (rent, bills)
 * paid for by whoever chips in. Nothing here reads or writes foundation data,
 * and club figures never appear in `getFundBalance()`.
 *
 *   monthBalance   = collected this month − expenses this month
 *   runningBalance = all-time collected  − all-time expenses  (cash in hand)
 */

import { connectDB } from "@/lib/db";
import { ClubCollection, ClubExpense } from "@/models";

export interface ClubSummary {
  periodLabel: string;
  monthCollected: number;
  monthExpenses: number;
  monthBalance: number;
  totalCollected: number;
  totalExpenses: number;
  runningBalance: number;
  contributorsThisMonth: number;
}

export async function getClubSummary(periodLabel: string): Promise<ClubSummary> {
  await connectDB();

  const [monthColl, monthExp, allColl, allExp] = await Promise.all([
    ClubCollection.aggregate([
      { $match: { periodLabel } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          people: { $addToSet: "$contributorId" },
        },
      },
    ]),
    ClubExpense.aggregate([
      { $match: { periodLabel } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    ClubCollection.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    ClubExpense.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
  ]);

  const monthCollected = monthColl[0]?.total ?? 0;
  const monthExpenses = monthExp[0]?.total ?? 0;
  const totalCollected = allColl[0]?.total ?? 0;
  const totalExpenses = allExp[0]?.total ?? 0;

  return {
    periodLabel,
    monthCollected,
    monthExpenses,
    monthBalance: monthCollected - monthExpenses,
    totalCollected,
    totalExpenses,
    runningBalance: totalCollected - totalExpenses,
    contributorsThisMonth: (monthColl[0]?.people ?? []).length,
  };
}
