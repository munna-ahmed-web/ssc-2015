import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { Loan, Member } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { getFundBalance } from "@/lib/fundBalance";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

const STATUSES = ["pending", "active", "rejected", "recovered", "written_off"] as const;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const overdueOnly = searchParams.get("overdue") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));

    const filter: Record<string, unknown> = {};
    if (status && (STATUSES as readonly string[]).includes(status)) {
      filter.status = status;
    }
    if (overdueOnly) {
      filter.status = "active";
      filter.expectedReturnDate = { $lt: new Date() };
    }

    const [loans, total, fund] = await Promise.all([
      Loan.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("proposedBy approvedBy rejectedBy writtenOffBy", "name")
        .lean(),
      Loan.countDocuments(filter),
      getFundBalance(),
    ]);

    // Overdue count for the tab badge (always computed, independent of filters)
    const overdueCount = await Loan.countDocuments({
      status: "active",
      expectedReturnDate: { $lt: new Date() },
    });

    return apiSuccess(loans, {
      meta: {
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        fund,
        overdueCount,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/loans]");
  }
}

const ProposeSchema = z.object({
  borrowerName: z.string().min(2, "Borrower name must be at least 2 characters").max(200).trim(),
  borrowerMemberId: z.string().optional(),
  borrowerPhone: z.string().max(30).trim().optional(),
  purpose: z.string().max(2000).trim().optional(),
  principal: z.number().int().min(1, "Amount must be at least 1"),
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

    const {
      borrowerName,
      borrowerMemberId,
      borrowerPhone,
      purpose,
      principal,
      expectedReturnDate,
    } = parsed.data;

    // If a member is linked, verify it exists and take their real name/phone
    let memberId: mongoose.Types.ObjectId | undefined;
    let resolvedName = borrowerName;
    let resolvedPhone = borrowerPhone;
    if (borrowerMemberId) {
      if (!mongoose.isValidObjectId(borrowerMemberId)) {
        return apiError("BAD_REQUEST", "Invalid member ID.", 400);
      }
      const member = await Member.findById(borrowerMemberId).select("fullName phone").lean();
      if (!member) {
        return apiError("NOT_FOUND", "Member not found.", 404);
      }
      memberId = member._id;
      resolvedName = member.fullName;
      resolvedPhone = member.phone;
    }

    const loan = await Loan.create({
      borrowerName: resolvedName,
      borrowerMemberId: memberId,
      borrowerPhone: resolvedPhone,
      purpose,
      principal,
      expectedReturnDate,
      status: "pending",
      proposedBy: new mongoose.Types.ObjectId(admin.sub),
    });

    await logActivity({
      actorId: admin.sub,
      action: "loan.propose",
      entityType: "loan",
      entityId: String(loan._id),
      entityLabel: resolvedName,
      details: { principal, expectedReturnDate: expectedReturnDate.toISOString() },
    });

    return apiSuccess(loan, {
      message: "Loan proposed. A different admin must approve it before the money is disbursed.",
      status: 201,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[POST /api/admin/loans]");
  }
}
