/** Logged-in member's own profile subset from GET /api/member/me */
export interface SerializedMemberProfile {
  _id: string;
  fullName: string;
  memberCode: string;
  photoUrl?: string;
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

/** Shareable foundation aggregates from GET /api/member/stats */
export interface SerializedMemberStats {
  currentPeriodLabel: string;
  activeMembers: number;
  collectedThisPeriod: number;
  collectedAllTime: number;
}
