/**
 * ClubCollection — money collected from a person for the club room, per month.
 *
 * Separate from the foundation's Contribution ledger in every way (own
 * collection, own people, own balance). Entries can be deleted by an admin if
 * recorded by mistake; every delete is written to the Activity Log, so the
 * history stays traceable without the reversal machinery the foundation
 * ledger needs.
 */

import type { Document, Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

export interface IClubCollection extends Document {
  contributorId: Types.ObjectId; // ref ClubContributor
  contributorName: string; // denormalized for fast listing
  amount: number; // integer taka
  periodLabel: string; // "YYYY-MM" — the month this money is for
  paidAt: Date;
  notes?: string;
  recordedBy: Types.ObjectId; // ref User (admin)
  createdAt: Date;
  updatedAt: Date;
}

const clubCollectionSchema = new Schema<IClubCollection>(
  {
    contributorId: {
      type: Schema.Types.ObjectId,
      ref: "ClubContributor",
      required: [true, "Contributor is required"],
    },
    contributorName: {
      type: String,
      required: [true, "Contributor name is required (denormalized)"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least 1"],
    },
    periodLabel: {
      type: String,
      required: [true, "Month is required"],
      trim: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, "Invalid month. Use YYYY-MM"],
    },
    paidAt: { type: Date, required: true, default: () => new Date() },
    notes: { type: String, trim: true, maxlength: [500, "Notes are too long"] },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recorded-by admin is required"],
    },
  },
  { timestamps: true, collection: "club_collections" },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

clubCollectionSchema.index({ periodLabel: 1, paidAt: -1 });
clubCollectionSchema.index({ contributorId: 1, periodLabel: 1 });

const ClubCollection: Model<IClubCollection> =
  (mongoose.models.ClubCollection as Model<IClubCollection> | undefined) ??
  mongoose.model<IClubCollection>("ClubCollection", clubCollectionSchema);

export default ClubCollection;
