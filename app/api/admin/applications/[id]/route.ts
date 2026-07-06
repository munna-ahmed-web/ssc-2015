import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { MembershipApplication, Member } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

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

async function generateMemberCode(): Promise<string> {
  const count = await Member.countDocuments();
  return `MEM-${String(count + 1).padStart(3, "0")}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("BAD_REQUEST", "Invalid application ID.", 400);
    }

    const application = await MembershipApplication.findById(id).lean();
    if (!application) {
      return apiError("NOT_FOUND", "Application not found.", 404);
    }

    return apiSuccess(application);
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/applications/:id]");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("BAD_REQUEST", "Invalid application ID.", 400);
    }

    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Validation failed.",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const application = await MembershipApplication.findById(id);
    if (!application) {
      return apiError("NOT_FOUND", "Application not found.", 404);
    }

    if (application.status !== "pending") {
      return apiError(
        "CONFLICT",
        `Application is already ${application.status} and cannot be modified.`,
        409,
      );
    }

    const now = new Date();
    const reviewedBy = new mongoose.Types.ObjectId(admin.sub);

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

      return apiSuccess(
        { memberCode, memberId: member._id.toString(), applicationId: application._id.toString() },
        { message: `Application approved. Member ${memberCode} created.` },
      );
    }

    application.status = "rejected";
    application.rejectionReason = parsed.data.rejectionReason;
    application.reviewedBy = reviewedBy;
    application.reviewedAt = now;
    await application.save();

    return apiSuccess(
      { applicationId: application._id.toString(), status: "rejected" },
      { message: "Application rejected." },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[PATCH /api/admin/applications/:id]");
  }
}
