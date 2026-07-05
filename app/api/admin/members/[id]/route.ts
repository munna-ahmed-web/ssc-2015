import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { Member } from "@/models";
import { requireAdmin } from "@/lib/auth";

// Schema for updating member fields (all optional except possibly validated types)
const UpdateMemberSchema = z.object({
  fullName: z.string().min(2, "Name too short").trim().optional(),
  guardianName: z.string().min(2, "Guardian name too short").trim().optional(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, "Invalid phone format").optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  nid: z.string().min(5, "NID too short").trim().optional(),
  address: z.string().min(5, "Address too short").trim().optional(),
  dateOfBirth: z.string().transform((v) => new Date(v)).optional(),
  occupation: z.string().trim().optional(),
  photoUrl: z.string().url().or(z.literal("")).optional(),
  contributionType: z.enum(["weekly", "monthly"]).optional(),
  contributionAmount: z.number().min(1, "Amount must be at least 1").optional(),
  status: z.enum(["active", "suspended", "exited"]).optional(),
});

// ─── GET /api/admin/members/[id] ──────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: "Invalid member ID" }, { status: 400 });
    }

    const member = await Member.findById(id).lean();
    if (!member) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    }

    // Return member record with contribution history stub (history database query in Phase 7)
    return NextResponse.json({
      success: true,
      data: {
        ...member,
        contributions: [], // Placeholder stub
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/admin/members/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// ─── PATCH /api/admin/members/[id] ────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: "Invalid member ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = UpdateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const member = await Member.findById(id);
    if (!member) {
      return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    }

    const data = parsed.data;

    // Apply text / data updates if present
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

    // Handle status toggling and lifecycle timestamps
    if (data.status !== undefined && data.status !== member.status) {
      const prevStatus = member.status;
      member.status = data.status;

      if (data.status === "suspended") {
        member.suspendedAt = new Date();
      } else if (data.status === "exited") {
        member.exitedAt = new Date();
      } else if (data.status === "active") {
        // Reactivating a member resets suspend and exit timestamps
        member.suspendedAt = undefined;
        member.exitedAt = undefined;
      }
    }

    await member.save();

    return NextResponse.json({
      success: true,
      message: "Member updated successfully.",
      data: member,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[PATCH /api/admin/members/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
