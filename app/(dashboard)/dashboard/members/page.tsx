import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MemberStatusBadge from "@/features/members/MemberStatusBadge";
import { connectDB } from "@/lib/db";
import { Member } from "@/models";
import type { MemberStatus, IMember } from "@/models";

export const metadata = { title: "Members — SSC-2015 Foundation Admin" };

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Exited", value: "exited" },
];

async function getMembers(status: string, search: string, page: number) {
  await connectDB();
  const limit = 20;
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

  return { members, total, limit };
}

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function MembersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const status = sp.status ?? "all";
  const search = sp.search ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1"));

  const { members, total, limit } = await getMembers(status, search, page);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Members Directory</h2>
          <p className="text-muted-foreground mt-1">
            View, inspect, and update profiles or lifecycle status of enrolled members
          </p>
        </div>
        <Badge variant="secondary" className="self-start sm:self-center gap-1.5">
          <Users className="size-3" />
          {total} member{total !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/members?status=${tab.value}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
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
          id="search-members"
          name="search"
          defaultValue={search}
          placeholder="Search by name, phone, or member code…"
          className="flex-1 h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <Button type="submit" size="sm" variant="outline">
          Search
        </Button>
        {search && (
          <Button asChild size="sm" variant="ghost">
            <Link href={`/dashboard/members?status=${status}`}>Clear</Link>
          </Button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Code", "Name", "Phone", "Frequency", "Premium Amount", "Status", "Joined At", ""].map(
                  (h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="size-8 mx-auto mb-2 opacity-30" />
                    No members found
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const m = member as unknown as IMember & { _id: { toString(): string }; joinedAt: Date };
                  return (
                    <tr key={m._id.toString()} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-primary">{m.memberCode}</td>
                      <td className="px-4 py-3 font-medium">{m.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.phone}</td>
                      <td className="px-4 py-3 capitalize">
                        <Badge variant="outline" className="text-xs">
                          {m.contributionType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">৳{m.contributionAmount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <MemberStatusBadge status={m.status as MemberStatus} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(m.joinedAt).toLocaleDateString("en-BD")}
                      </td>
                      <td className="px-4 py-3">
                        <Button asChild size="xs" variant="outline">
                          <Link href={`/dashboard/members/${m._id.toString()}`}>
                            Manage
                          </Link>
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
                  href={`/dashboard/members?status=${status}&search=${search}&page=${page - 1}`}
                >
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/dashboard/members?status=${status}&search=${search}&page=${page + 1}`}
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
