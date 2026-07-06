import type { NextRequest } from "next/server";

import { connectDB } from "@/lib/db";
import { Member } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

/**
 * GET /api/admin/members
 * Query params: status (all, active, suspended, exited), search (name, phone), page, limit
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

    const filter: Record<string, unknown> = {};
    if (status !== "all") {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { memberCode: { $regex: search, $options: "i" } },
      ];
    }

    const [members, total] = await Promise.all([
      Member.find(filter)
        .sort({ joinedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Member.countDocuments(filter),
    ]);

    return apiSuccess(members, {
      meta: {
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/members]");
  }
}
