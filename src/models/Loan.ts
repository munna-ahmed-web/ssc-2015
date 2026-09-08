/**
 * Loan model — interest-free lending (qard) from the foundation fund.
 *
 * The borrower repays EXACTLY the principal — no interest, ever. There is no
 * profit concept here; the only outcomes are "fully recovered" or an
 * outstanding balance (optionally written off).
 *
 * Lifecycle (append-style transitions, documents are never deleted):
 *   pending → active     (two-admin rule: approver must differ from proposer)
 *   pending → rejected   (any admin incl. the proposer — doubles as "withdraw")
 *   active  → recovered  (automatically once repayments reach the principal)
 *   active  → written_off (admin decision when the money cannot be recovered)
 *
 * Design decisions:
 *  - `approvedAt` IS the disbursement date — money leaves the fund at approval.
 *  - Repayments are an append-only array; each entry records amount, date and
 *    the admin who received it. Rows are never edited or removed.
 *  - `borrowerMemberId` links to a Member when the borrower is one of our
 *    members; `borrowerName` is always stored so external institutions work too.
 *  - Amounts are integer taka so repayment sums stay exact.
 *  - Available-balance guard runs at approval; a concurrent double-approve
 *    could briefly overshoot the fund — accepted for a 3–4 admin team.
 */

import type { Document, Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoanStatus = "pending" | "active" | "rejected" | "recovered" | "written_off";

export interface ILoanRepayment {
  amount: number; // integer taka, > 0
  paidAt: Date;
  receivedBy: Types.ObjectId; // ref User — admin who took the money
  notes?: string;
}

export interface ILoan extends Document {
  borrowerName: string; // member or institution name (always stored)
  borrowerMemberId?: Types.ObjectId; // ref Member when the borrower is a member
  borrowerPhone?: string;
  purpose?: string;

  principal: number; // integer taka lent — the exact amount to be repaid
  expectedReturnDate: Date;

  status: LoanStatus;

  proposedBy: Types.ObjectId; // ref User
  approvedBy?: Types.ObjectId; // ref User — must differ from proposedBy
  approvedAt?: Date; // disbursement date
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectedReason?: string;

  repayments: ILoanRepayment[];
  recoveredAt?: Date; // set when repayments reach the principal

  writtenOffBy?: Types.ObjectId;
  writtenOffAt?: Date;
  writeOffReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const repaymentSchema = new Schema<ILoanRepayment>(
  {
    amount: {
      type: Number,
      required: [true, "Repayment amount is required"],
      min: [1, "Repayment amount must be at least 1"],
    },
    paidAt: {
      type: Date,
      required: [true, "Repayment date is required"],
      default: () => new Date(),
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiving admin is required"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes must be at most 500 characters"],
    },
  },
  { _id: false },
);

const loanSchema = new Schema<ILoan>(
  {
    borrowerName: {
      type: String,
      required: [true, "Borrower name is required"],
      trim: true,
      maxlength: [200, "Borrower name must be at most 200 characters"],
    },
    borrowerMemberId: { type: Schema.Types.ObjectId, ref: "Member" },
    borrowerPhone: { type: String, trim: true },
    purpose: {
      type: String,
      trim: true,
      maxlength: [2000, "Purpose must be at most 2000 characters"],
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
      enum: ["pending", "active", "rejected", "recovered", "written_off"],
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

    repayments: { type: [repaymentSchema], default: [] },
    recoveredAt: { type: Date },

    writtenOffBy: { type: Schema.Types.ObjectId, ref: "User" },
    writtenOffAt: { type: Date },
    writeOffReason: {
      type: String,
      trim: true,
      maxlength: [1000, "Write-off reason must be at most 1000 characters"],
    },
  },
  {
    timestamps: true,
    collection: "loans",
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// NOTE: autoIndex is disabled app-wide — mirror any change here in
// scripts/sync-indexes.mjs and run it once.

// List views filtered by status, newest first
loanSchema.index({ status: 1, createdAt: -1 });

// Overdue view: active loans past their expected return date
loanSchema.index({ status: 1, expectedReturnDate: 1 });

// Loans for a given member
loanSchema.index({ borrowerMemberId: 1, createdAt: -1 });

// ─── Model (singleton — safe for Next.js hot-reload) ─────────────────────────

const Loan: Model<ILoan> =
  (mongoose.models.Loan as Model<ILoan> | undefined) ?? mongoose.model<ILoan>("Loan", loanSchema);

export default Loan;
