/**
 * MembershipApplication model — public form submissions.
 *
 * Submitted by prospective members via the public-facing form (Phase 3).
 * On admin approval (Phase 5), a `Member` document is created from this record,
 * and this document's `status` is updated to "approved" and linked via `memberId`.
 *
 * Design decisions:
 *  - `status` is the single source of truth for where an application stands.
 *  - `memberId` is only populated after approval — null means not yet approved.
 *  - Photo stored as a URL (uploaded to cloud storage in Phase 5+).
 *  - `rejectionReason` required when status is "rejected" (enforced at API layer).
 */

import type { Document, Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

// ─── Interface ────────────────────────────────────────────────────────────────

export type ApplicationStatus = "pending" | "approved" | "rejected";
export type ContributionType = "weekly" | "monthly";

export interface IMembershipApplication extends Document {
  // Personal info
  fullName: string;
  guardianName: string;
  phone: string;
  email?: string;
  nid: string; // National ID
  address: string;
  dateOfBirth: Date;
  occupation?: string;
  photoUrl?: string;

  // Contribution preferences
  requestedContributionType: ContributionType;
  requestedContributionAmount: number;

  // Workflow
  status: ApplicationStatus;
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId; // Reference to User (_id of reviewing admin)
  reviewedAt?: Date;

  // Link to created Member document after approval
  memberId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const membershipApplicationSchema = new Schema<IMembershipApplication>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [150, "Full name must be at most 150 characters"],
    },
    guardianName: {
      type: String,
      required: [true, "Guardian name is required"],
      trim: true,
      maxlength: [150, "Guardian name must be at most 150 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, "Invalid phone number format"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    nid: {
      type: String,
      required: [true, "National ID is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: [500, "Address must be at most 500 characters"],
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    occupation: {
      type: String,
      trim: true,
      maxlength: [100, "Occupation must be at most 100 characters"],
    },
    photoUrl: {
      type: String,
      trim: true,
    },

    requestedContributionType: {
      type: String,
      enum: ["weekly", "monthly"],
      required: [true, "Contribution type is required"],
    },
    requestedContributionAmount: {
      type: Number,
      required: [true, "Contribution amount is required"],
      min: [1, "Contribution amount must be at least 1"],
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [1000, "Rejection reason must be at most 1000 characters"],
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
    },
  },
  {
    timestamps: true,
    collection: "membership_applications",
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Primary filter in admin list view: status
membershipApplicationSchema.index({ status: 1, createdAt: -1 });

// Duplicate-check warning: phone and NID lookups on the public form
membershipApplicationSchema.index({ phone: 1 });
membershipApplicationSchema.index({ nid: 1 });

// ─── Model (singleton — safe for Next.js hot-reload) ─────────────────────────

const MembershipApplication: Model<IMembershipApplication> =
  (mongoose.models.MembershipApplication as Model<IMembershipApplication>) ??
  mongoose.model<IMembershipApplication>("MembershipApplication", membershipApplicationSchema);

export default MembershipApplication;
