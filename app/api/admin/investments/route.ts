import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { Investment } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { getFundBalance } from "@/lib/fundBalance";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

const STATUSES = ["pending", "active", "rejected", "closed"] as const;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));

    const filter: Record<string, unknown> = {};
    if (status && (STATUSES as readonly string[]).includes(status)) {
      filter.status = status;
    }

    const [investments, total, fund] = await Promise.all([
      Investment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("proposedBy approvedBy rejectedBy closedBy", "name")
        .lean(),
      Investment.countDocuments(filter),
      getFundBalance(),
    ]);

    return apiSuccess(investments, {
      meta: {
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        fund,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/investments]");
  }
}

const ProposeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  principal: z.number().int().min(1, "Principal must be at least 1"),
  expectedReturnDate: z.coerce
    .date()
    .refine((d) => d.getTime() > Date.now(), "Expected return date must be in the future"),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const parsed = ProposeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Validation failed.",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const { title, description, principal, expectedReturnDate } = parsed.data;

    const investment = await Investment.create({
      title,
      description,
      principal,
      expectedReturnDate,
      status: "pending",
      proposedBy: new mongoose.Types.ObjectId(admin.sub),
    });

    await logActivity({
      actorId: admin.sub,
      action: "investment.propose",
      entityType: "investment",
      entityId: String(investment._id),
      entityLabel: title,
      details: { principal, expectedReturnDate: expectedReturnDate.toISOString() },
    });

    return apiSuccess(investment, {
      message: "Investment proposed. A different admin must approve it before it becomes active.",
      status: 201,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[POST /api/admin/investments]");
  }
}
