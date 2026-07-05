/**
 * Contribution model — append-only financial ledger.
 *
 * Design decisions:
 *  - APPEND-ONLY: rows are never edited or deleted.
 *    Corrections are made via a reversing entry (`isReversal: true`, `reversalOf` pointing
 *    to the original row). This keeps the ledger fully auditable.
 *  - `periodLabel` is a canonical string:
 *      Monthly → "YYYY-MM"      (e.g. "2026-07")
 *      Weekly  → "YYYY-WNN"     (e.g. "2026-W27")
 *    Use `getPeriodLabel()` from @/types to generate these.
 *  - Compound unique index on (memberId, periodLabel) prevents accidental duplicate
 *    entries for the same member and period. Reversal entries are exempt via a
 *    partial index filter.
 *  - `recordedBy` is always required — every row has a clear audit trail.
 */

import type { Document, Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IContribution extends Document {
  memberId: Types.ObjectId;

  // Denormalized for fast reporting without joins
  memberName: string;
  contributionType: "weekly" | "monthly";

  amount: number;
  periodLabel: string; // Canonical: "2026-07" | "2026-W27"
  paidAt: Date; // Actual date the cash was handed over

  // Append-only reversal support
  isReversal: boolean;
  reversalOf?: Types.ObjectId; // Points to original Contribution _id if this is a reversal

  // Audit
  recordedBy: Types.ObjectId; // User who recorded this entry
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const contributionSchema = new Schema<IContribution>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "Member is required"],
    },
    memberName: {
      type: String,
      required: [true, "Member name is required (denormalized)"],
      trim: true,
    },
    contributionType: {
      type: String,
      enum: ["weekly", "monthly"],
      required: [true, "Contribution type is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    periodLabel: {
      type: String,
      required: [true, "Period label is required"],
      trim: true,
      match: [
        /^\d{4}-(0[1-9]|1[0-2])$|^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/,
        "Invalid period label format. Use YYYY-MM or YYYY-WNN",
      ],
    },
    paidAt: {
      type: Date,
      required: [true, "Payment date is required"],
      default: () => new Date(),
    },
    isReversal: {
      type: Boolean,
      default: false,
    },
    reversalOf: {
      type: Schema.Types.ObjectId,
      ref: "Contribution",
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recorded-by user is required"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes must be at most 500 characters"],
    },
  },
  {
    timestamps: true,
    collection: "contributions",
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Core uniqueness constraint: one confirmed contribution per member per period.
// Reversal entries are explicitly excluded from this constraint via partial filter.
contributionSchema.index(
  { memberId: 1, periodLabel: 1 },
  {
    unique: true,
    partialFilterExpression: { isReversal: false },
    name: "unique_member_period_non_reversal",
  },
);

// Defaulters view: find members with no contribution for a given periodLabel
contributionSchema.index({ periodLabel: 1, memberId: 1 });

// Full history for a member, sorted newest-first
contributionSchema.index({ memberId: 1, paidAt: -1 });

// Date range report queries
contributionSchema.index({ paidAt: -1 });

// ─── Model (singleton — safe for Next.js hot-reload) ─────────────────────────

const Contribution: Model<IContribution> =
  (mongoose.models.Contribution as Model<IContribution>) ??
  mongoose.model<IContribution>("Contribution", contributionSchema);

export default Contribution;
