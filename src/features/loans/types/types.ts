import type { LoanStatus } from "@/models/Loan";
import type { FundBalanceBreakdown } from "@/lib/fundBalance";

/** Populated { _id, name } on GET routes; plain id string on mutation responses */
export type AdminRef = string | { _id: string; name?: string };

export interface SerializedRepayment {
  amount: number;
  paidAt: string;
  receivedBy: AdminRef;
  notes?: string;
}

export interface SerializedLoan {
  _id: string;
  borrowerName: string;
  borrowerMemberId?: string;
  borrowerPhone?: string;
  purpose?: string;
  principal: number;
  expectedReturnDate: string;
  status: LoanStatus;
  proposedBy: AdminRef;
  approvedBy?: AdminRef;
  approvedAt?: string;
  rejectedBy?: AdminRef;
  rejectedAt?: string;
  rejectedReason?: string;
  repayments: SerializedRepayment[];
  recoveredAt?: string;
  writtenOffBy?: AdminRef;
  writtenOffAt?: string;
  writeOffReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type FundSummary = FundBalanceBreakdown;

export interface LoanFilters {
  status?: LoanStatus;
  overdue?: boolean;
  page?: number;
  limit?: number;
}

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  pending: "Pending Approval",
  active: "Active",
  rejected: "Rejected",
  recovered: "Fully Recovered",
  written_off: "Written Off",
};

export const LOAN_STATUS_BADGE_CLASSES: Record<LoanStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300",
  active: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-300",
  recovered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300",
  written_off: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-300",
};

/** Total repaid on a loan (repayments are append-only) */
export function repaidTotal(loan: SerializedLoan): number {
  return loan.repayments.reduce((sum, r) => sum + r.amount, 0);
}

/** Still owed on a loan — interest-free, so never more than the principal */
export function outstandingOf(loan: SerializedLoan): number {
  return Math.max(0, loan.principal - repaidTotal(loan));
}

/** An active loan past its expected return date */
export function isOverdue(loan: SerializedLoan): boolean {
  return loan.status === "active" && new Date(loan.expectedReturnDate).getTime() < Date.now();
}
