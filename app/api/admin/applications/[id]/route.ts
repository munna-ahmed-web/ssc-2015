import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { MembershipApplication, Member } from "@/models";
import { requireAdmin } from "@/lib/auth";

// ─── Validation ───────────────────────────────────────────────────────────────

const ApproveSchema = z.object({ action: z.literal("approve") });
const RejectSchema = z.object({
  action: z.literal("reject"),
  rejectionReason: z
    .string()
    .min(5, "Reason must be at least 5 characters")
    .max(1000, "Reason is too long")
    .trim(),
});
const ActionSchema = z.discriminatedUnion("action", [ApproveSchema, RejectSchema]);

// ─── Member code generation ───────────────────────────────────────────────────

async function generateMemberCode(): Promise<string> {
  const count = await Member.countDocuments();
  return `MEM-${String(count + 1).padStart(3, "0")}`;
}

// ─── GET /api/admin/applications/[id] ────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const application = await MembershipApplication.findById(id).lean();
    if (!application) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: application });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/admin/applications/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// ─── PATCH /api/admin/applications/[id] ──────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const application = await MembershipApplication.findById(id);
    if (!application) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    // Idempotency guard — only pending applications can be acted on
    if (application.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: `Application is already ${application.status} and cannot be modified.`,
        },
        { status: 409 },
      );
    }

    const now = new Date();
    const reviewedBy = new mongoose.Types.ObjectId(admin.sub);

    // ── APPROVE ────────────────────────────────────────────────────────────

    if (parsed.data.action === "approve") {
      const memberCode = await generateMemberCode();

      const member = await Member.create({
        applicationId: application._id,
        memberCode,
        fullName: application.fullName,
        guardianName: application.guardianName,
        phone: application.phone,
        email: application.email,
        nid: application.nid,
        address: application.address,
        dateOfBirth: application.dateOfBirth,
        occupation: application.occupation,
        photoUrl: application.photoUrl,
        contributionType: application.requestedContributionType,
        contributionAmount: application.requestedContributionAmount,
        status: "active",
        joinedAt: now,
        approvedBy: reviewedBy,
      });

      application.status = "approved";
      application.memberId = member._id as mongoose.Types.ObjectId;
      application.reviewedBy = reviewedBy;
      application.reviewedAt = now;
      await application.save();

      return NextResponse.json({
        success: true,
        message: `Application approved. Member ${memberCode} created.`,
        memberCode,
      });
    }

    // ── REJECT ─────────────────────────────────────────────────────────────

    application.status = "rejected";
    application.rejectionReason = parsed.data.rejectionReason;
    application.reviewedBy = reviewedBy;
    application.reviewedAt = now;
    await application.save();

    return NextResponse.json({ success: true, message: "Application rejected." });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[PATCH /api/admin/applications/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
