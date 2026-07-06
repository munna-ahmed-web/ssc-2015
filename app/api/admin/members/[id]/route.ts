import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { Member } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

const UpdateMemberSchema = z.object({
  fullName: z.string().min(2, "Name too short").trim().optional(),
  guardianName: z.string().min(2, "Guardian name too short").trim().optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Invalid phone format")
    .optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  nid: z.string().min(5, "NID too short").trim().optional(),
  address: z.string().min(5, "Address too short").trim().optional(),
  dateOfBirth: z
    .string()
    .transform((v) => new Date(v))
    .optional(),
  occupation: z.string().trim().optional(),
  photoUrl: z.string().url().or(z.literal("")).optional(),
  contributionType: z.enum(["weekly", "monthly"]).optional(),
  contributionAmount: z.number().min(1, "Amount must be at least 1").optional(),
  status: z.enum(["active", "suspended", "exited"]).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("BAD_REQUEST", "Invalid member ID.", 400);
    }

    const member = await Member.findById(id).lean();
    if (!member) {
      return apiError("NOT_FOUND", "Member not found.", 404);
    }

    return apiSuccess({
      ...member,
      contributions: [],
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/members/:id]");
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("BAD_REQUEST", "Invalid member ID.", 400);
    }

    const body = await req.json();
    const parsed = UpdateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Validation failed.",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const member = await Member.findById(id);
    if (!member) {
      return apiError("NOT_FOUND", "Member not found.", 404);
    }

    const data = parsed.data;

    if (data.fullName !== undefined) member.fullName = data.fullName;
    if (data.guardianName !== undefined) member.guardianName = data.guardianName;
    if (data.phone !== undefined) member.phone = data.phone;
    if (data.email !== undefined) member.email = data.email || undefined;
    if (data.nid !== undefined) member.nid = data.nid;
    if (data.address !== undefined) member.address = data.address;
    if (data.dateOfBirth !== undefined) member.dateOfBirth = data.dateOfBirth;
    if (data.occupation !== undefined) member.occupation = data.occupation;
    if (data.photoUrl !== undefined) member.photoUrl = data.photoUrl || undefined;
    if (data.contributionType !== undefined) member.contributionType = data.contributionType;
    if (data.contributionAmount !== undefined) member.contributionAmount = data.contributionAmount;

    if (data.status !== undefined && data.status !== member.status) {
      member.status = data.status;

      if (data.status === "suspended") {
        member.suspendedAt = new Date();
      } else if (data.status === "exited") {
        member.exitedAt = new Date();
      } else if (data.status === "active") {
        member.suspendedAt = undefined;
        member.exitedAt = undefined;
      }
    }

    await member.save();

    return apiSuccess(member, { message: "Member updated successfully." });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[PATCH /api/admin/members/:id]");
  }
}
