import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { MembershipApplication } from "@/models";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/applications
 * Query params: status, search, page, limit
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") ?? "all";
    const search = searchParams.get("search")?.trim() ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));

    // Build filter
    const filter: Record<string, unknown> = {};
    if (status !== "all") filter.status = status;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { nid: { $regex: search, $options: "i" } },
      ];
    }

    const [applications, total] = await Promise.all([
      MembershipApplication.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      MembershipApplication.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: applications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/admin/applications]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
