import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { Contribution } from "@/models";
import { requireAdmin } from "@/lib/auth";

// ─── POST /api/admin/contributions/[id]/reverse ────────────────────────────────
// Creates an audit-safe reversal entry pointing to the original row.

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
      return NextResponse.json({ success: false, error: "Invalid contribution ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = ReversalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const original = await Contribution.findById(id);
    if (!original) {
      return NextResponse.json({ success: false, error: "Contribution not found" }, { status: 404 });
    }

    // Prevent reversing an already-reversed entry
    if (original.isReversal) {
      return NextResponse.json(
        { success: false, error: "Cannot reverse a reversal entry." },
        { status: 409 },
      );
    }

    // Prevent double-reversal: check if a reversal already exists for this entry
    const existingReversal = await Contribution.findOne({ reversalOf: original._id });
    if (existingReversal) {
      return NextResponse.json(
        { success: false, error: "A reversal for this contribution already exists." },
        { status: 409 },
      );
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

    return NextResponse.json(
      { success: true, message: "Reversal entry created.", data: reversal },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[POST /api/admin/contributions/:id/reverse]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
