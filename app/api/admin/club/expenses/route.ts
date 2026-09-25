import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { ClubExpense } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { getClubSummary } from "@/lib/clubSummary";
import { apiError, apiSuccess, apiValidationError, handleRouteError } from "@/lib/api/response";

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const periodLabel = req.nextUrl.searchParams.get("periodLabel");
    if (!periodLabel || !PERIOD_RE.test(periodLabel)) {
      return apiError("BAD_REQUEST", "A valid periodLabel (YYYY-MM) is required.", 400);
    }

    const [expenses, summary] = await Promise.all([
      ClubExpense.find({ periodLabel })
        .sort({ spentAt: -1, createdAt: -1 })
        .populate("recordedBy", "name")
        .lean(),
      getClubSummary(periodLabel),
    ]);

    return apiSuccess(expenses, { meta: { summary } });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/club/expenses]");
  }
}

const CreateSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(200).trim(),
  amount: z.number().int().min(1, "Amount must be at least 1"),
  periodLabel: z.string().regex(PERIOD_RE, "Invalid month"),
  spentAt: z.coerce.date().optional(),
  notes: z.string().max(500).trim().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const parsed = CreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { title, amount, periodLabel, spentAt, notes } = parsed.data;

    const expense = await ClubExpense.create({
      title,
      amount,
      periodLabel,
      spentAt: spentAt ?? new Date(),
      notes,
      recordedBy: new mongoose.Types.ObjectId(admin.sub),
    });

    await logActivity({
      actorId: admin.sub,
      action: "club.expense_add",
      entityType: "club",
      entityId: String(expense._id),
      entityLabel: title,
      details: { amount, periodLabel },
    });

    return apiSuccess(expense, {
      message: `Expense of ৳${amount.toLocaleString()} recorded.`,
      status: 201,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[POST /api/admin/club/expenses]");
  }
}
