import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { ClubCollection, ClubContributor } from "@/models";
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

    const [collections, summary] = await Promise.all([
      ClubCollection.find({ periodLabel })
        .sort({ paidAt: -1, createdAt: -1 })
        .populate("recordedBy", "name")
        .lean(),
      getClubSummary(periodLabel),
    ]);

    return apiSuccess(collections, { meta: { summary } });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/club/collections]");
  }
}

const CreateSchema = z.object({
  contributorId: z.string().min(1, "Please select a person"),
  amount: z.number().int().min(1, "Amount must be at least 1"),
  periodLabel: z.string().regex(PERIOD_RE, "Invalid month"),
  paidAt: z.coerce.date().optional(),
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

    const { contributorId, amount, periodLabel, paidAt, notes } = parsed.data;

    if (!mongoose.isValidObjectId(contributorId)) {
      return apiError("BAD_REQUEST", "Invalid contributor ID.", 400);
    }
    const contributor = await ClubContributor.findById(contributorId).select("name").lean();
    if (!contributor) {
      return apiError("NOT_FOUND", "Contributor not found.", 404);
    }

    const collection = await ClubCollection.create({
      contributorId: contributor._id,
      contributorName: contributor.name,
      amount,
      periodLabel,
      paidAt: paidAt ?? new Date(),
      notes,
      recordedBy: new mongoose.Types.ObjectId(admin.sub),
    });

    await logActivity({
      actorId: admin.sub,
      action: "club.collection_add",
      entityType: "club",
      entityId: String(collection._id),
      entityLabel: contributor.name,
      details: { amount, periodLabel },
    });

    return apiSuccess(collection, {
      message: `৳${amount.toLocaleString()} collected from ${contributor.name}.`,
      status: 201,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[POST /api/admin/club/collections]");
  }
}
