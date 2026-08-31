import type { InvestmentStatus } from "@/models/Investment";
import type { FundBalanceBreakdown } from "@/lib/fundBalance";

/** Populated { _id, name } on GET routes; plain id string on mutation responses */
export type AdminRef = string | { _id: string; name?: string };

export interface SerializedProfitAllocation {
  purpose: string;
  amount: number;
}

export interface SerializedInvestment {
  _id: string;
  title: string;
  description?: string;
  principal: number;
  expectedReturnDate: string;
  status: InvestmentStatus;
  proposedBy: AdminRef;
  approvedBy?: AdminRef;
  approvedAt?: string;
  rejectedBy?: AdminRef;
  rejectedAt?: string;
  rejectedReason?: string;
  closedBy?: AdminRef;
  closedAt?: string;
  returnedAmount?: number;
  profitAllocations: SerializedProfitAllocation[];
  createdAt: string;
  updatedAt: string;
}

export type FundSummary = FundBalanceBreakdown;

export interface InvestmentFilters {
  status?: InvestmentStatus;
  page?: number;
  limit?: number;
}

export const STATUS_LABELS: Record<InvestmentStatus, string> = {
  pending: "Pending Approval",
  active: "Active",
  rejected: "Rejected",
  closed: "Closed",
};

export const STATUS_BADGE_CLASSES: Record<InvestmentStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300",
  active: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-300",
  closed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300",
};
