import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { Loan } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { getFundBalance } from "@/lib/fundBalance";
import { apiError, apiForbidden, apiSuccess, handleRouteError } from "@/lib/api/response";

const ApproveSchema = z.object({ action: z.literal("approve") });
const RejectSchema = z.object({
  action: z.literal("reject"),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(1000).trim(),
});
const RepaymentSchema = z.object({
  action: z.literal("repayment"),
  amount: z.number().int().positive("Repayment amount must be positive"),
  paidAt: z.coerce.date().optional(),
  notes: z.string().max(500).trim().optional(),
});
const WriteOffSchema = z.object({
  action: z.literal("write_off"),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(1000).trim(),
});
const ActionSchema = z.discriminatedUnion("action", [
  ApproveSchema,
  RejectSchema,
  RepaymentSchema,
  WriteOffSchema,
]);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("BAD_REQUEST", "Invalid loan ID.", 400);
    }

    const loan = await Loan.findById(id)
      .populate("proposedBy approvedBy rejectedBy writtenOffBy", "name")
      .populate("repayments.receivedBy", "name")
      .lean();
    if (!loan) {
      return apiError("NOT_FOUND", "Loan not found.", 404);
    }

    return apiSuccess(loan);
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/loans/:id]");
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("BAD_REQUEST", "Invalid loan ID.", 400);
    }

    const parsed = ActionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Validation failed.",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const loan = await Loan.findById(id);
    if (!loan) {
      return apiError("NOT_FOUND", "Loan not found.", 404);
    }

    const now = new Date();
    const actorId = new mongoose.Types.ObjectId(admin.sub);
    const repaidSoFar = loan.repayments.reduce((sum, r) => sum + r.amount, 0);

    // ── Approve (two-admin rule + balance guard) — money is disbursed here ───
    if (parsed.data.action === "approve") {
      if (loan.status !== "pending") {
        return apiError("CONFLICT", `Loan is already ${loan.status.replace("_", " ")}.`, 409);
      }
      if (loan.proposedBy.toString() === admin.sub) {
        return apiForbidden(
          "Two-admin rule: you proposed this loan; a different admin must approve it.",
        );
      }

      const fund = await getFundBalance();
      if (loan.principal > fund.availableBalance) {
        return apiError(
          "CONFLICT",
          `Insufficient fund balance. Available: ৳${fund.availableBalance.toLocaleString()}, requested: ৳${loan.principal.toLocaleString()}.`,
          409,
        );
      }

      loan.status = "active";
      loan.approvedBy = actorId;
      loan.approvedAt = now;
      await loan.save();

      await logActivity({
        actorId: admin.sub,
        action: "loan.approve",
        entityType: "loan",
        entityId: String(loan._id),
        entityLabel: loan.borrowerName,
        details: { principal: loan.principal },
      });

      return apiSuccess(loan, {
        message: `Loan approved. ৳${loan.principal.toLocaleString()} disbursed to ${loan.borrowerName}.`,
      });
    }

    // ── Reject (only pending; proposer may withdraw their own) ──────────────
    if (parsed.data.action === "reject") {
      if (loan.status !== "pending") {
        return apiError(
          "CONFLICT",
          loan.status === "active"
            ? "An active loan cannot be rejected — record repayments, or write it off if unrecoverable."
            : `Loan is already ${loan.status.replace("_", " ")}.`,
          409,
        );
      }

      loan.status = "rejected";
      loan.rejectedBy = actorId;
      loan.rejectedAt = now;
      loan.rejectedReason = parsed.data.reason;
      await loan.save();

      await logActivity({
        actorId: admin.sub,
        action: "loan.reject",
        entityType: "loan",
        entityId: String(loan._id),
        entityLabel: loan.borrowerName,
        details: { reason: parsed.data.reason },
      });

      return apiSuccess(loan, { message: "Loan proposal rejected." });
    }

    // ── Write off (accept the money as unrecoverable) ───────────────────────
    if (parsed.data.action === "write_off") {
      if (loan.status !== "active") {
        return apiError("CONFLICT", "Only an active loan can be written off.", 409);
      }

      loan.status = "written_off";
      loan.writtenOffBy = actorId;
      loan.writtenOffAt = now;
      loan.writeOffReason = parsed.data.reason;
      await loan.save();

      const unrecovered = loan.principal - repaidSoFar;
      await logActivity({
        actorId: admin.sub,
        action: "loan.write_off",
        entityType: "loan",
        entityId: String(loan._id),
        entityLabel: loan.borrowerName,
        details: {
          principal: loan.principal,
          repaid: repaidSoFar,
          unrecovered,
          reason: parsed.data.reason,
        },
      });

      return apiSuccess(loan, {
        message: `Loan written off. ৳${unrecovered.toLocaleString()} recorded as unrecoverable.`,
      });
    }

    // ── Record a repayment (interest-free: never more than the principal) ───
    if (loan.status !== "active") {
      return apiError(
        "CONFLICT",
        `Repayments can only be recorded on an active loan (this one is ${loan.status.replace("_", " ")}).`,
        409,
      );
    }

    const { amount, paidAt, notes } = parsed.data;
    const outstanding = loan.principal - repaidSoFar;
    if (amount > outstanding) {
      return apiError(
        "VALIDATION_ERROR",
        `This loan is interest-free — only ৳${outstanding.toLocaleString()} is still owed. Do not accept more than the outstanding amount.`,
        422,
      );
    }

    loan.repayments.push({
      amount,
      paidAt: paidAt ?? now,
      receivedBy: actorId,
      notes,
    });

    const newRepaidTotal = repaidSoFar + amount;
    const fullyRepaid = newRepaidTotal >= loan.principal;
    if (fullyRepaid) {
      loan.status = "recovered";
      loan.recoveredAt = paidAt ?? now;
    }
    await loan.save();

    await logActivity({
      actorId: admin.sub,
      action: "loan.repayment",
      entityType: "loan",
      entityId: String(loan._id),
      entityLabel: loan.borrowerName,
      details: {
        amount,
        repaidTotal: newRepaidTotal,
        principal: loan.principal,
        fullyRepaid,
      },
    });

    return apiSuccess(loan, {
      message: fullyRepaid
        ? `Repayment recorded. Loan fully recovered — ৳${loan.principal.toLocaleString()} returned to the fund.`
        : `Repayment of ৳${amount.toLocaleString()} recorded. ৳${(loan.principal - newRepaidTotal).toLocaleString()} still outstanding.`,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[PATCH /api/admin/loans/:id]");
  }
}
