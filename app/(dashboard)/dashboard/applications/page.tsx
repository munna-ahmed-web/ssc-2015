import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ApplicationStatusBadge from "@/features/applications/ApplicationStatusBadge";
import { connectDB } from "@/lib/db";
import { MembershipApplication } from "@/models";
import type { ApplicationStatus, IMembershipApplication } from "@/models";

export const metadata = { title: "Applications — SSC-2015 Foundation Admin" };

// ─── Status filter tabs ───────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

// ─── Server data fetch ────────────────────────────────────────────────────────

async function getApplications(status: string, search: string, page: number) {
  await connectDB();
  const limit = 20;
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

  return { applications, total, limit };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function ApplicationsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const status = sp.status ?? "all";
  const search = sp.search ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1"));

  const { applications, total, limit } = await getApplications(status, search, page);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Membership Applications</h2>
          <p className="text-muted-foreground mt-1">
            Review, approve, and reject incoming applications
          </p>
        </div>
        <Badge variant="secondary" className="self-start sm:self-center gap-1.5">
          <ClipboardList className="size-3" />
          {total} total
        </Badge>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/applications?status=${tab.value}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              status === tab.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2 max-w-md">
        <input type="hidden" name="status" value={status} />
        <input
          id="search-applications"
          name="search"
          defaultValue={search}
          placeholder="Search by name, phone, or NID…"
          className="flex-1 h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <Button type="submit" size="sm" variant="outline">
          Search
        </Button>
        {search && (
          <Button asChild size="sm" variant="ghost">
            <Link href={`/dashboard/applications?status=${status}`}>Clear</Link>
          </Button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Name", "Phone", "NID", "Type", "Amount", "Status", "Submitted", ""].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    <ClipboardList className="size-8 mx-auto mb-2 opacity-30" />
                    No applications found
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const a = app as unknown as IMembershipApplication & {
                    _id: { toString(): string };
                    createdAt: Date;
                  };
                  return (
                    <tr key={a._id.toString()} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{a.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.phone}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.nid}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs capitalize">
                          {a.requestedContributionType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        ৳{a.requestedContributionAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <ApplicationStatusBadge status={a.status as ApplicationStatus} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(a.createdAt).toLocaleDateString("en-BD")}
                      </td>
                      <td className="px-4 py-3">
                        <Button asChild size="xs" variant="outline">
                          <Link href={`/dashboard/applications/${a._id.toString()}`}>Review</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/dashboard/applications?status=${status}&search=${search}&page=${page - 1}`}
                >
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/dashboard/applications?status=${status}&search=${search}&page=${page + 1}`}
                >
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
