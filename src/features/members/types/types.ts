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
  /** Plain id on list/mutation responses; populated { _id, name } on detail GET */
  approvedBy: string | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

// Re-exported from the contributions feature (single source of truth)
export type { SerializedContribution } from "@/features/contributions/types/types";
