export interface SerializedReportBreakdown {
  memberId: string;
  memberCode: string;
  fullName: string;
  phone: string;
  contributionType: string;
  expectedAmount: number;
  paid: boolean;
  actualAmount: number | null;
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
