import { connectDB } from "@/lib/db";
import { MembershipApplication, Contribution } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const [reviews, logs] = await Promise.all([
      MembershipApplication.find({ status: { $ne: "pending" } })
        .sort({ reviewedAt: -1 })
        .limit(30)
        .populate("reviewedBy", "name email")
        .lean(),
      Contribution.find({})
        .sort({ createdAt: -1 })
        .limit(30)
        .populate("recordedBy", "name email")
        .lean(),
    ]);

    const formattedReviews = reviews.map((r) => ({
      id: r._id.toString(),
      type: "application",
      action: r.status === "approved" ? "Approved Application" : "Rejected Application",
      targetName: r.fullName,
      performedBy: (r.reviewedBy as unknown as { name?: string })?.name ?? "System / Admin",
      timestamp: r.reviewedAt ?? r.updatedAt,
      details: r.status === "rejected" ? `Reason: ${r.rejectionReason}` : undefined,
    }));

    const formattedContributions = logs.map((c) => ({
      id: c._id.toString(),
      type: "contribution",
      action: c.isReversal ? "Reversed Contribution" : "Recorded Contribution",
      targetName: c.memberName,
      performedBy: (c.recordedBy as unknown as { name?: string })?.name ?? "Admin",
      timestamp: c.createdAt,
      details: `${c.isReversal ? "−" : ""}৳${c.amount.toLocaleString()} for period ${c.periodLabel}${c.notes ? ` (${c.notes})` : ""}`,
    }));

    const allLogs = [...formattedReviews, ...formattedContributions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return apiSuccess(allLogs);
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/audit-logs]");
  }
}
