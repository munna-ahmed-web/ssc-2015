import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { Investment } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { getFundBalance } from "@/lib/fundBalance";
import { apiError, apiForbidden, apiSuccess, handleRouteError } from "@/lib/api/response";

const ApproveSchema = z.object({ action: z.literal("approve") });
const RejectSchema = z.object({
  action: z.literal("reject"),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(1000).trim(),
});
const CloseSchema = z.object({
  action: z.literal("close"),
  returnedAmount: z.number().int().min(0, "Returned amount cannot be negative"),
  returnedAt: z.coerce.date().optional(),
  allocations: z
    .array(
      z.object({
        purpose: z.string().min(2, "Purpose too short").max(100).trim(),
        amount: z.number().int().positive("Allocation amount must be positive"),
      }),
    )
    .max(20)
    .default([]),
});
const ActionSchema = z.discriminatedUnion("action", [ApproveSchema, RejectSchema, CloseSchema]);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("BAD_REQUEST", "Invalid investment ID.", 400);
    }

    const investment = await Investment.findById(id)
      .populate("proposedBy approvedBy rejectedBy closedBy", "name")
      .lean();
    if (!investment) {
      return apiError("NOT_FOUND", "Investment not found.", 404);
    }

    return apiSuccess(investment);
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/investments/:id]");
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("BAD_REQUEST", "Invalid investment ID.", 400);
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

    const investment = await Investment.findById(id);
    if (!investment) {
      return apiError("NOT_FOUND", "Investment not found.", 404);
    }

    const now = new Date();
    const actorId = new mongoose.Types.ObjectId(admin.sub);

    // ── Approve (two-admin rule + balance guard) ─────────────────────────────
    if (parsed.data.action === "approve") {
      if (investment.status !== "pending") {
        return apiError("CONFLICT", `Investment is already ${investment.status}.`, 409);
      }
      if (investment.proposedBy.toString() === admin.sub) {
        return apiForbidden(
          "Two-admin rule: you proposed this investment; a different admin must approve it.",
        );
      }

      const fund = await getFundBalance();
      if (investment.principal > fund.availableBalance) {
        return apiError(
          "CONFLICT",
          `Insufficient fund balance. Available: ৳${fund.availableBalance.toLocaleString()}, requested: ৳${investment.principal.toLocaleString()}.`,
          409,
        );
      }

      investment.status = "active";
      investment.approvedBy = actorId;
      investment.approvedAt = now;
      await investment.save();

      await logActivity({
        actorId: admin.sub,
        action: "investment.approve",
        entityType: "investment",
        entityId: String(investment._id),
        entityLabel: investment.title,
        details: { principal: investment.principal },
      });

      return apiSuccess(investment, {
        message: `Investment approved. ৳${investment.principal.toLocaleString()} is now invested.`,
      });
    }

    // ── Reject (only pending; proposer may withdraw their own) ───────────────
    if (parsed.data.action === "reject") {
      if (investment.status !== "pending") {
        return apiError(
          "CONFLICT",
          investment.status === "active"
            ? "An active investment cannot be rejected — close it with the actual returned amount instead."
            : `Investment is already ${investment.status}.`,
          409,
        );
      }

      investment.status = "rejected";
      investment.rejectedBy = actorId;
      investment.rejectedAt = now;
      investment.rejectedReason = parsed.data.reason;
      await investment.save();

      await logActivity({
        actorId: admin.sub,
        action: "investment.reject",
        entityType: "investment",
        entityId: String(investment._id),
        entityLabel: investment.title,
        details: { reason: parsed.data.reason },
      });

      return apiSuccess(investment, { message: "Investment proposal rejected." });
    }

    // ── Close (record actual outcome: profit or loss) ────────────────────────
    if (investment.status !== "active") {
      return apiError("CONFLICT", `Only an active investment can be closed.`, 409);
    }

    const { returnedAmount, returnedAt, allocations } = parsed.data;
    const profit = returnedAmount - investment.principal;

    if (profit <= 0 && allocations.length > 0) {
      return apiError(
        "VALIDATION_ERROR",
        "Profit allocations are only allowed when the investment made a profit.",
        422,
      );
    }
    const allocatedTotal = allocations.reduce((sum, a) => sum + a.amount, 0);
    if (profit > 0 && allocatedTotal > profit) {
      return apiError(
        "VALIDATION_ERROR",
        `Allocations (৳${allocatedTotal.toLocaleString()}) exceed the profit (৳${profit.toLocaleString()}). The unallocated remainder stays in the fund automatically — do not allocate it.`,
        422,
      );
    }

    investment.status = "closed";
    investment.closedBy = actorId;
    investment.closedAt = returnedAt ?? now;
    investment.returnedAmount = returnedAmount;
    investment.profitAllocations = allocations;
    await investment.save();

    await logActivity({
      actorId: admin.sub,
      action: "investment.close",
      entityType: "investment",
      entityId: String(investment._id),
      entityLabel: investment.title,
      details: {
        principal: investment.principal,
        returnedAmount,
        profit,
        allocations,
      },
    });

    let message = "Investment closed — broke even.";
    if (profit > 0) {
      message = `Investment closed with a profit of ৳${profit.toLocaleString()}.`;
    } else if (profit < 0) {
      message = `Investment closed. Loss of ৳${Math.abs(profit).toLocaleString()} recorded.`;
    }

    return apiSuccess(investment, { message });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[PATCH /api/admin/investments/:id]");
  }
}
