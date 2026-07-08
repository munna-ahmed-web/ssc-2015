/* eslint-disable no-nested-ternary */
"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ClipboardList, Loader2, AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ApplicationStatusBadge from "@/features/applications/ApplicationStatusBadge";
import { useFetchApplications } from "@/features/applications/hook/applicationHooks";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default function ApplicationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const status = searchParams.get("status") ?? "all";
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));

  const { data, isLoading, isError, error } = useFetchApplications({
    status,
    search,
    page,
    limit: 20,
  });

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchVal = (formData.get("search") as string).trim() ?? "";

    const params = new URLSearchParams(searchParams.toString());
    if (searchVal) {
      params.set("search", searchVal);
    } else {
      params.delete("search");
    }
    params.set("page", "1"); // Reset page to 1 on new search
    router.push(`/dashboard/applications?${params.toString()}`);
  };

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
          {isLoading ? <Loader2 className="size-3 animate-spin" /> : (data?.total ?? 0)} total
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
      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
        <input
          id="search-applications"
          name="search"
          key={search} // Force refresh input field value on search clear
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="size-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading applications…</p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-6 text-center">
          <AlertCircle className="size-8 mx-auto text-destructive mb-2" />
          <p className="text-sm font-medium text-destructive">Failed to load applications</p>
          <p className="text-xs text-destructive/80 mt-1">
            {error instanceof Error ? error.message : "An error occurred."}
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Name", "Phone", "NID", "Type", "Amount", "Status", "Submitted", ""].map(
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
                  {data?.applications.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                        <ClipboardList className="size-8 mx-auto mb-2 opacity-30" />
                        No applications found
                      </td>
                    </tr>
                  ) : (
                    data?.applications.map((a) => {
                      return (
                        <tr key={a._id} className="hover:bg-muted/30 transition-colors">
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
                            <ApplicationStatusBadge status={a.status} />
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {new Date(a.createdAt).toLocaleDateString("en-BD")}
                          </td>
                          <td className="px-4 py-3">
                            <Button asChild size="xs" variant="outline">
                              <Link href={`/dashboard/applications/${a._id}`}>Review</Link>
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
          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {(page - 1) * (data?.limit ?? 20) + 1}–
                {Math.min(page * (data?.limit ?? 20), data?.total ?? 0)} of {data?.total ?? 0}
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
                {page < (data?.totalPages ?? 1) && (
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
        </>
      )}
    </div>
  );
}
