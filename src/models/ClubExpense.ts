/**
 * ClubExpense — a monthly cost of running the club room (rent, electricity,
 * water, internet, cleaning, …).
 *
 * Separate from the foundation's money entirely — club expenses never touch
 * the foundation fund balance.
 */

import type { Document, Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

export interface IClubExpense extends Document {
  title: string; // e.g. "Room rent", "Electricity bill"
  amount: number; // integer taka
  periodLabel: string; // "YYYY-MM" — the month this cost belongs to
  spentAt: Date;
  notes?: string;
  recordedBy: Types.ObjectId; // ref User (admin)
  createdAt: Date;
  updatedAt: Date;
}

const clubExpenseSchema = new Schema<IClubExpense>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title must be at most 200 characters"],
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
    spentAt: { type: Date, required: true, default: () => new Date() },
    notes: { type: String, trim: true, maxlength: [500, "Notes are too long"] },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recorded-by admin is required"],
    },
  },
  { timestamps: true, collection: "club_expenses" },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

clubExpenseSchema.index({ periodLabel: 1, spentAt: -1 });

const ClubExpense: Model<IClubExpense> =
  (mongoose.models.ClubExpense as Model<IClubExpense> | undefined) ??
  mongoose.model<IClubExpense>("ClubExpense", clubExpenseSchema);

export default ClubExpense;
