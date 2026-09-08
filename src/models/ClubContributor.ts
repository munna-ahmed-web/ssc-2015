/**
 * ClubContributor — a person who chips in for the club room costs.
 *
 * DELIBERATELY SEPARATE from the foundation's Member collection: the club room
 * is its own little pot of money with its own people, and nothing here
 * references foundation data. A person may exist in both places; they are
 * unrelated records by design.
 */

import type { Document, Model } from "mongoose";
import mongoose, { Schema } from "mongoose";

export interface IClubContributor extends Document {
  name: string;
  phone?: string;
  isActive: boolean; // Inactive people stay on old records but are hidden from pickers
  createdAt: Date;
  updatedAt: Date;
}

const clubContributorSchema = new Schema<IClubContributor>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [150, "Name must be at most 150 characters"],
    },
    phone: { type: String, trim: true, maxlength: [30, "Phone is too long"] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "club_contributors" },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// NOTE: autoIndex is disabled app-wide — mirror changes in scripts/sync-indexes.mjs.

clubContributorSchema.index({ isActive: 1, name: 1 });

const ClubContributor: Model<IClubContributor> =
  (mongoose.models.ClubContributor as Model<IClubContributor> | undefined) ??
  mongoose.model<IClubContributor>("ClubContributor", clubContributorSchema);

export default ClubContributor;
