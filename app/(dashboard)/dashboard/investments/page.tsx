/* eslint-disable no-nested-ternary */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Briefcase,
  Loader2,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminName } from "@/lib/utils";
import InvestmentStatusBadge from "@/features/investments/InvestmentStatusBadge";
import ProposeInvestmentDialog from "@/features/investments/ProposeInvestmentDialog";
import { useFetchInvestments } from "@/features/investments/hook/investmentHooks";
import type { InvestmentStatus } from "@/models/Investment";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "Closed", value: "closed" },
  { label: "Rejected", value: "rejected" },
] as const;

export default function InvestmentsPage() {
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const [proposeOpen, setProposeOpen] = useState(false);

  const { data, isLoading, isError, error } = useFetchInvestments({
    status: (status || undefined) as InvestmentStatus | undefined,
    page,
    limit: 25,
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const investments = data?.investments ?? [];
  const fund = data?.fund ?? null;
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const limit = data?.limit ?? 25;

  const buildHref = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    return `/dashboard/investments?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Investments</h2>
          <p className="text-muted-foreground mt-1">
            Foundation money invested for returns — two-admin approval, profits and losses recorded
            honestly
          </p>
        </div>
        <Button className="gap-2 self-start sm:self-center" onClick={() => setProposeOpen(true)}>
          <Plus className="size-4" />
          Propose Investment
        </Button>
      </div>

      {/* Fund summary tiles */}
      {fund && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Available Balance
                </p>
                <Wallet className="size-4 text-primary" />
              </div>
              <p className="text-2xl font-bold font-heading mt-2">
                ৳{fund.availableBalance.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Spendable / investable now</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Currently Invested
                </p>
                <Briefcase className="size-4 text-primary" />
              </div>
              <p className="text-2xl font-bold font-heading mt-2">
                ৳{fund.currentlyInvested.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Out working in active investments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Total Profit
                </p>
                <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold font-heading mt-2 text-green-700 dark:text-green-400">
                ৳{fund.totalProfitEarned.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ৳{fund.totalExternallyAllocated.toLocaleString()} allocated to causes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Loss</p>
                <TrendingDown
                  className={`size-4 ${fund.totalLossIncurred > 0 ? "text-destructive" : "text-muted-foreground/50"}`}
                />
              </div>
              <p
                className={`text-2xl font-bold font-heading mt-2 ${
                  fund.totalLossIncurred > 0 ? "text-destructive" : ""
                }`}
              >
                ৳{fund.totalLossIncurred.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Across all closed investments</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={buildHref({ status: tab.value, page: "1" })}
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="size-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading investments…</p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-6 text-center">
          <AlertCircle className="size-8 mx-auto text-destructive mb-2" />
          <p className="text-sm font-medium text-destructive">Failed to load investments</p>
          <p className="text-xs text-destructive/80 mt-1">
            {error instanceof Error ? error.message : "An error occurred."}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {[
                      "Title",
                      "Principal",
                      "Status",
                      "Proposed By",
                      "Expected Return",
                      "Created",
                    ].map((h) => (
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
                  {investments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        <Briefcase className="size-8 mx-auto mb-2 opacity-30" />
                        No investments {status ? `with status "${status}"` : "yet"}
                      </td>
                    </tr>
                  ) : (
                    investments.map((inv) => (
                      <tr key={inv._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          <Link
                            href={`/dashboard/investments/${inv._id}`}
                            className="text-primary hover:underline font-semibold"
                          >
                            {inv.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          ৳{inv.principal.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <InvestmentStatusBadge status={inv.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {adminName(inv.proposedBy) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {mounted
                            ? new Date(inv.expectedReturnDate).toLocaleDateString("en-BD")
                            : "…"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {mounted ? new Date(inv.createdAt).toLocaleDateString("en-BD") : "…"}
                        </td>
                      </tr>
                    ))
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
                    <Link href={buildHref({ page: String(page - 1) })}>Previous</Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={buildHref({ page: String(page + 1) })}>Next</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <ProposeInvestmentDialog
        open={proposeOpen}
        onClose={() => setProposeOpen(false)}
        availableBalance={fund?.availableBalance ?? null}
      />
    </div>
  );
}
