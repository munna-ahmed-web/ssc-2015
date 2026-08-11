import type { ApplicationStatus } from "@/models";

export interface SerializedApplication {
  _id: string;
  fullName: string;
  guardianName: string;
  phone: string;
  email?: string;
  nid: string;
  address: string;
  dateOfBirth: string;
  occupation?: string;
  photoUrl?: string;
  requestedContributionType: "weekly" | "monthly";
  requestedContributionAmount: number;
  status: ApplicationStatus;
  rejectionReason?: string;
  /** Plain id on list responses; populated { _id, name } on detail GET */
  reviewedBy?: string | { _id: string; name: string };
  reviewedAt?: string;
  memberId?: string;
  createdAt: string;
  updatedAt: string;
}
