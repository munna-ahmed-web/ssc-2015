import type { MemberStatus } from "@/models";

export interface SerializedMember {
  _id: string;
  applicationId: string;
  memberCode: string;
  fullName: string;
  guardianName: string;
  phone: string;
  email?: string;
  nid: string;
  address: string;
  dateOfBirth: string;
  occupation?: string;
  photoUrl?: string;
  contributionType: "weekly" | "monthly";
  contributionAmount: number;
  status: MemberStatus;
  joinedAt: string;
  exitedAt?: string;
  suspendedAt?: string;
  approvedBy: string;
  createdAt: string;
  updatedAt: string;
}

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
