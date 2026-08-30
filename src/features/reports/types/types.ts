export interface SerializedReportBreakdown {
  memberId: string;
  memberCode: string;
  fullName: string;
  phone: string;
  contributionType: string;
  expectedAmount: number;
  paid: boolean;
  /** Total of all (non-reversed) payments this period */
  actualAmount: number | null;
  /** How many separate payments the member made this period */
  paymentsCount: number;
  /** Date of the most recent payment */
  paidAt: string | null;
  notes: string | null;
}

export interface SerializedReport {
  periodLabel: string;
  summary: {
    activeMembers: number;
    paidCount: number;
    defaultersCount: number;
    totalCollected: number;
    expectedTotal: number;
    collectionRate: number;
  };
  breakdown: SerializedReportBreakdown[];
}
