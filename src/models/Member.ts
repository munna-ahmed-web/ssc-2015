/**
 * Member model — created when a MembershipApplication is approved.
 *
 * Key design decisions:
 *  - `applicationId` links back to the original application (read-only after creation).
 *  - `contributionType` and `contributionAmount` are locked in at approval time.
 *    If the amount needs to change later, overwrite the field (v1 decision — versioned
 *    history deferred to future scope).
 *  - `status` lifecycle: active → suspended → active (reactivatable) | exited (terminal).
 *  - `memberCode` is a human-readable sequential identifier (e.g. "MEM-001") generated
 *    at application approval time.
 */

import type { Document, Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

import type { ContributionType } from "./MembershipApplication";

// ─── Interface ────────────────────────────────────────────────────────────────

export type MemberStatus = "active" | "suspended" | "exited";

export interface IMember extends Document {
  // Source application
  applicationId: Types.ObjectId;

  // Human-readable identifier
  memberCode: string; // e.g. "MEM-001"

  // Profile (copied from application at approval; editable after)
  fullName: string;
  guardianName: string;
  phone: string;
  email?: string;
  nid: string;
  address: string;
  dateOfBirth: Date;
  occupation?: string;
  photoUrl?: string;

  // Contribution settings (locked at approval, overwritable in v1)
  contributionType: ContributionType;
  contributionAmount: number;

  // Lifecycle
  status: MemberStatus;
  joinedAt: Date; // Date of approval
  exitedAt?: Date;
  suspendedAt?: Date;

  // Audit
  approvedBy: Types.ObjectId; // User who approved the application

  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const memberSchema = new Schema<IMember>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "MembershipApplication",
      required: true,
      unique: true, // One member per application
    },
    memberCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    guardianName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    nid: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    occupation: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    photoUrl: {
      type: String,
      trim: true,
    },

    contributionType: {
      type: String,
      enum: ["weekly", "monthly"],
      required: true,
    },
    contributionAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["active", "suspended", "exited"],
      default: "active",
    },
    joinedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    exitedAt: {
      type: Date,
    },
    suspendedAt: {
      type: Date,
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "members",
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Admin list view: filter by status, sort by joinedAt
memberSchema.index({ status: 1, joinedAt: -1 });

// Search by name
memberSchema.index({ fullName: "text" });

// Lookup by phone (common admin search)
memberSchema.index({ phone: 1 });

// ─── Model (singleton — safe for Next.js hot-reload) ─────────────────────────

const Member: Model<IMember> =
  (mongoose.models.Member as Model<IMember>) ?? mongoose.model<IMember>("Member", memberSchema);

export default Member;
