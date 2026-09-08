import type { NextRequest } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { ClubExpense } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

/**
 * DELETE /api/admin/club/expenses/[id]
 * Mistaken entries are deleted outright; the Activity Log keeps the record.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("BAD_REQUEST", "Invalid expense ID.", 400);
    }

    const expense = await ClubExpense.findById(id);
    if (!expense) {
      return apiError("NOT_FOUND", "Expense not found.", 404);
    }

    const snapshot = {
      amount: expense.amount,
      periodLabel: expense.periodLabel,
      title: expense.title,
    };

    await expense.deleteOne();

    await logActivity({
      actorId: admin.sub,
      action: "club.expense_delete",
      entityType: "club",
      entityId: id,
      entityLabel: snapshot.title,
      details: snapshot,
    });

    return apiSuccess({ id }, { message: "Expense deleted." });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[DELETE /api/admin/club/expenses/:id]");
  }
}
