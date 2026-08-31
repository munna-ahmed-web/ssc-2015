/** Logged-in member's own profile subset from GET /api/member/me */
export interface SerializedMemberProfile {
  _id: string;
  fullName: string;
  memberCode: string;
  photoUrl?: string;
  guardianName: string;
  phone: string;
  contributionType: "weekly" | "monthly";
  contributionAmount: number;
  status: string;
  joinedAt: string;
}

/** One of the member's own ledger rows from GET /api/member/me/contributions */
export interface SerializedMyContribution {
  _id: string;
  amount: number;
  periodLabel: string;
  paidAt: string;
  isReversal: boolean;
  reversalOf?: string;
  notes?: string;
  createdAt: string;
}

export interface MyContributionFilters {
  page?: number;
  limit?: number;
  year?: number;
  includeReversals?: boolean;
}

export interface YearlyTotal {
  year: number;
  total: number;
}

/** Summary numbers returned alongside the member's contribution list */
export interface MyContributionSummary {
  myTotalPaid: number;
  paymentsCount: number;
  lastPaidAt: string | null;
  thisYearTotal: number;
  yearlyBreakdown: YearlyTotal[];
  availableYears: number[];
  currentPeriodLabel: string;
  currentPeriodPaid: boolean;
}

export interface MonthlyTrendPoint {
  periodLabel: string;
  total: number;
}

/** Shareable foundation aggregates from GET /api/member/stats */
export interface SerializedMemberStats {
  currentPeriodLabel: string;
  activeMembers: number;
  paidMembersThisPeriod: number;
  collectedThisPeriod: number;
  collectedAllTime: number;
  monthlyTrend: MonthlyTrendPoint[];
}
