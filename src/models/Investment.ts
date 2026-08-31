/**
 * Investment model — foundation money invested into a sector for a term.
 *
 * Lifecycle (append-style transitions, documents are never deleted):
 *   pending → active   (two-admin rule: approver must differ from proposer)
 *   pending → rejected (any admin incl. the proposer — doubles as "withdraw")
 *   active  → closed   (records actual returnedAmount: profit OR loss)
 *
 * Design decisions:
 *  - `approvedAt` IS the start of the term — money leaves the fund at approval.
 *  - `returnedAmount` may be less than, equal to, or greater than `principal`;
 *    losses are recorded honestly, never hidden.
 *  - `profitAllocations` are the profit shares that LEAVE the fund (e.g.
 *    "Social work", "Club room expense"). The unallocated remainder of profit
 *    implicitly stays in the fund and is never stored as an allocation row.
 *    Route-enforced: allocations only when profit > 0 and Σ amounts ≤ profit.
 *  - Amounts are integer taka to keep allocation-sum checks exact.
 *  - Available-balance guard runs at approval; a concurrent double-approve
 *    could briefly overshoot the fund — accepted for a 3–4 admin team.
 */

import type { Document, Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvestmentStatus = "pending" | "active" | "rejected" | "closed";

export interface IProfitAllocation {
  purpose: string; // e.g. "Social work" — where this profit share goes
  amount: number; // integer taka, > 0
}

export interface IInvestment extends Document {
  title: string; // sector / short label
  description?: string;
  principal: number; // integer taka invested
  expectedReturnDate: Date;

  status: InvestmentStatus;

  proposedBy: Types.ObjectId; // ref User
  approvedBy?: Types.ObjectId; // ref User — must differ from proposedBy
  approvedAt?: Date; // start of the investment term
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectedReason?: string;

  closedBy?: Types.ObjectId;
  closedAt?: Date; // actual return date
  returnedAmount?: number; // integer taka actually returned (0 = total loss)
  profitAllocations: IProfitAllocation[];

  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const profitAllocationSchema = new Schema<IProfitAllocation>(
  {
    purpose: {
      type: String,
      required: [true, "Allocation purpose is required"],
      trim: true,
      maxlength: [100, "Purpose must be at most 100 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Allocation amount is required"],
      min: [1, "Allocation amount must be at least 1"],
    },
  },
  { _id: false },
);

const investmentSchema = new Schema<IInvestment>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title must be at most 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description must be at most 2000 characters"],
    },
    principal: {
      type: Number,
      required: [true, "Principal is required"],
      min: [1, "Principal must be at least 1"],
    },
    expectedReturnDate: {
      type: Date,
      required: [true, "Expected return date is required"],
    },

    status: {
      type: String,
      enum: ["pending", "active", "rejected", "closed"],
      default: "pending",
    },

    proposedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Proposer is required"],
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectedAt: { type: Date },
    rejectedReason: {
      type: String,
      trim: true,
      maxlength: [1000, "Rejection reason must be at most 1000 characters"],
    },

    closedBy: { type: Schema.Types.ObjectId, ref: "User" },
    closedAt: { type: Date },
    returnedAmount: {
      type: Number,
      min: [0, "Returned amount cannot be negative"],
    },
    profitAllocations: {
      type: [profitAllocationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "investments",
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// NOTE: autoIndex is disabled app-wide — mirror any change here in
// scripts/sync-indexes.mjs and run it once.

// List views filtered by status, newest first
investmentSchema.index({ status: 1, createdAt: -1 });

// Unfiltered list, newest first
investmentSchema.index({ createdAt: -1 });

// ─── Model (singleton — safe for Next.js hot-reload) ─────────────────────────

const Investment: Model<IInvestment> =
  (mongoose.models.Investment as Model<IInvestment> | undefined) ??
  mongoose.model<IInvestment>("Investment", investmentSchema);

export default Investment;
