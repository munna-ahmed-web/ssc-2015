import type { NextRequest } from "next/server";

import { connectDB } from "@/lib/db";
import { MembershipApplication, Contribution } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

/**
 * GET /api/admin/audit-logs
 *
 * Derived audit timeline merged from application reviews + contribution entries.
 * Query: type ("application" | "contribution", absent = both), page, limit.
 *
 * Merged pagination: fetch the top `page * limit` rows from each source (bounded),
 * merge-sort by timestamp, then slice the requested page — the merged top N is
 * always contained in the union of each source's top N.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));

    const includeApplications = type !== "contribution";
    const includeContributions = type !== "application";
    const fetchCount = page * limit;

    const [reviews, logs, reviewsTotal, logsTotal] = await Promise.all([
      includeApplications
        ? MembershipApplication.find({ status: { $ne: "pending" } })
            .sort({ reviewedAt: -1 })
            .limit(fetchCount)
            .populate("reviewedBy", "name email")
            .lean()
        : Promise.resolve([]),
      includeContributions
        ? Contribution.find({})
            .sort({ createdAt: -1 })
            .limit(fetchCount)
            .populate("recordedBy", "name email")
            .lean()
        : Promise.resolve([]),
      includeApplications
        ? MembershipApplication.countDocuments({ status: { $ne: "pending" } })
        : Promise.resolve(0),
      includeContributions ? Contribution.countDocuments({}) : Promise.resolve(0),
    ]);

    const formattedReviews = reviews.map((r) => ({
      id: r._id.toString(),
      type: "application",
      action: r.status === "approved" ? "Approved Application" : "Rejected Application",
      targetName: r.fullName,
      performedBy:
        (r.reviewedBy as unknown as { name?: string } | null | undefined)?.name ?? "System / Admin",
      timestamp: r.reviewedAt ?? r.updatedAt,
      details: r.status === "rejected" ? `Reason: ${r.rejectionReason}` : undefined,
    }));

    const formattedContributions = logs.map((c) => ({
      id: c._id.toString(),
      type: "contribution",
      action: c.isReversal ? "Reversed Contribution" : "Recorded Contribution",
      targetName: c.memberName,
      performedBy:
        (c.recordedBy as unknown as { name?: string } | null | undefined)?.name ?? "Admin",
      timestamp: c.createdAt,
      details: `${c.isReversal ? "−" : ""}৳${c.amount.toLocaleString()} for period ${c.periodLabel}${c.notes ? ` (${c.notes})` : ""}`,
    }));

    const merged = [...formattedReviews, ...formattedContributions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const total = reviewsTotal + logsTotal;
    const pageLogs = merged.slice((page - 1) * limit, page * limit);

    return apiSuccess(pageLogs, {
      meta: {
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/audit-logs]");
  }
}
