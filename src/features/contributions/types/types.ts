export interface SerializedContribution {
  _id: string;
  memberId: string;
  memberName: string;
  contributionType: "weekly" | "monthly";
  amount: number;
  periodLabel: string;
  paidAt: string;
  isReversal: boolean;
  reversalOf?: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
