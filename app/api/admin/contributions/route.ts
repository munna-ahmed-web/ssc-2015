import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { Contribution, Member } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const memberId = searchParams.get("memberId");
    const periodLabel = searchParams.get("periodLabel");
    const includeReversals = searchParams.get("includeReversals") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));

    const filter: Record<string, unknown> = {};
    if (memberId && mongoose.isValidObjectId(memberId)) {
      filter.memberId = new mongoose.Types.ObjectId(memberId);
    }
    if (periodLabel) {
      filter.periodLabel = periodLabel;
    }
    if (!includeReversals) {
      filter.isReversal = false;
    }

    const [contributions, total] = await Promise.all([
      Contribution.find(filter)
        .sort({ paidAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Contribution.countDocuments(filter),
    ]);

    return apiSuccess(contributions, {
      meta: {
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/contributions]");
  }
}

const RecordSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  periodLabel: z
    .string()
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])$|^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/,
      "Invalid period label",
    ),
  paidAt: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const body = await req.json();
    const parsed = RecordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Validation failed.",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const { memberId, periodLabel, paidAt, notes } = parsed.data;

    if (!mongoose.isValidObjectId(memberId)) {
      return apiError("BAD_REQUEST", "Invalid member ID.", 400);
    }

    const member = await Member.findById(memberId).lean();
    if (!member) {
      return apiError("NOT_FOUND", "Member not found.", 404);
    }
    if (member.status !== "active") {
      return apiError("CONFLICT", "Cannot record contribution for a non-active member.", 409);
    }

    const existing = await Contribution.findOne({
      memberId: member._id,
      periodLabel,
      isReversal: false,
    });
    if (existing) {
      return apiError(
        "DUPLICATE_ENTRY",
        `A contribution for ${member.fullName} in period ${periodLabel} already exists.`,
        409,
      );
    }

    const contribution = await Contribution.create({
      memberId: member._id,
      memberName: member.fullName,
      contributionType: member.contributionType,
      amount: member.contributionAmount,
      periodLabel,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      isReversal: false,
      recordedBy: new mongoose.Types.ObjectId(admin.sub),
      notes,
    });

    return apiSuccess(contribution, {
      message: "Contribution recorded.",
      status: 201,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    if ((err as { code?: number }).code === 11000) {
      return apiError(
        "DUPLICATE_ENTRY",
        "Duplicate contribution detected for this member and period.",
        409,
      );
    }
    return handleRouteError(err, "[POST /api/admin/contributions]");
  }
}
