import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { Contribution } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

const ReversalSchema = z.object({
  notes: z.string().min(5, "Reversal reason must be at least 5 characters").max(500).trim(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("BAD_REQUEST", "Invalid contribution ID.", 400);
    }

    const body = await req.json();
    const parsed = ReversalSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Validation failed.",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const original = await Contribution.findById(id);
    if (!original) {
      return apiError("NOT_FOUND", "Contribution not found.", 404);
    }

    if (original.isReversal) {
      return apiError("CONFLICT", "Cannot reverse a reversal entry.", 409);
    }

    const existingReversal = await Contribution.findOne({ reversalOf: original._id });
    if (existingReversal) {
      return apiError("CONFLICT", "A reversal for this contribution already exists.", 409);
    }

    const reversal = await Contribution.create({
      memberId: original.memberId,
      memberName: original.memberName,
      contributionType: original.contributionType,
      amount: original.amount,
      periodLabel: original.periodLabel,
      paidAt: original.paidAt,
      isReversal: true,
      reversalOf: original._id,
      recordedBy: new mongoose.Types.ObjectId(admin.sub),
      notes: parsed.data.notes,
    });

    return apiSuccess(reversal, {
      message: "Reversal entry created.",
      status: 201,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[POST /api/admin/contributions/:id/reverse]");
  }
}
