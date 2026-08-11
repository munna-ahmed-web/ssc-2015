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
  /** Plain id on mutation responses; populated { _id, name } on ledger GET */
  recordedBy: string | { _id: string; name: string };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
