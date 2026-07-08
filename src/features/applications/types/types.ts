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
  reviewedBy?: string;
  reviewedAt?: string;
  memberId?: string;
  createdAt: string;
  updatedAt: string;
}
