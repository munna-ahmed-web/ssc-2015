import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { Contribution, Member } from "@/models";
import { requireAdmin } from "@/lib/auth";

// ─── GET /api/admin/contributions ─────────────────────────────────────────────
// Query: memberId?, periodLabel?, includeReversals?, page?, limit?

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

    return NextResponse.json({
      success: true,
      data: contributions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/admin/contributions]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// ─── POST /api/admin/contributions ────────────────────────────────────────────
// Body: { memberId, periodLabel, paidAt?, notes? }

const RecordSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  periodLabel: z
    .string()
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])$|^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/,
      "Invalid period label",
    ),
  paidAt: z.string().optional(), // ISO date string
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const body = await req.json();
    const parsed = RecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const { memberId, periodLabel, paidAt, notes } = parsed.data;

    if (!mongoose.isValidObjectId(memberId)) {
      return NextResponse.json({ success: false, error: "Invalid member ID" }, { status: 400 });
    }

    // Fetch member to auto-fill denormalized fields
    const member = await Member.findById(memberId).lean();
    if (!member) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    }
    if (member.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Cannot record contribution for a non-active member." },
        { status: 409 },
      );
    }

    // Pre-check duplicate (the DB index will also catch it, but a friendly error is better UX)
    const existing = await Contribution.findOne({
      memberId: member._id,
      periodLabel,
      isReversal: false,
    });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `A contribution for ${member.fullName} in period ${periodLabel} already exists.`,
        },
        { status: 409 },
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

    return NextResponse.json(
      { success: true, message: "Contribution recorded.", data: contribution },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    // Mongo duplicate key
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { success: false, error: "Duplicate contribution detected for this member and period." },
        { status: 409 },
      );
    }
    console.error("[POST /api/admin/contributions]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
