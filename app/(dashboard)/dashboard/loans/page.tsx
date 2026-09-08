/* eslint-disable no-nested-ternary */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  HandCoins,
  Loader2,
  Plus,
  Wallet,
  CheckCircle2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminName } from "@/lib/utils";
import LoanStatusBadge from "@/features/loans/LoanStatusBadge";
import ProposeLoanDialog from "@/features/loans/ProposeLoanDialog";
import { useFetchLoans } from "@/features/loans/hook/loanHooks";
import { isOverdue, outstandingOf, repaidTotal } from "@/features/loans/types/types";
import type { LoanStatus } from "@/models/Loan";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "Recovered", value: "recovered" },
  { label: "Written Off", value: "written_off" },
  { label: "Rejected", value: "rejected" },
] as const;

export default function LoansPage() {
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "";
  const overdue = searchParams.get("overdue") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const [proposeOpen, setProposeOpen] = useState(false);

  const { data, isLoading, isError, error } = useFetchLoans({
    status: (overdue ? undefined : status || undefined) as LoanStatus | undefined,
    overdue: overdue || undefined,
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

  const loans = data?.loans ?? [];
  const fund = data?.fund ?? null;
  const overdueCount = data?.overdueCount ?? 0;
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const limit = data?.limit ?? 25;

  const buildHref = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (overdue) params.set("overdue", "true");
    params.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    return `/dashboard/loans?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Loans</h2>
          <p className="text-muted-foreground mt-1">
            Interest-free lending — the borrower repays exactly what was lent, never more
          </p>
        </div>
        <Button className="gap-2 self-start sm:self-center" onClick={() => setProposeOpen(true)}>
          <Plus className="size-4" />
          Propose Loan
        </Button>
      </div>

      {/* Fund tiles */}
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
              <p className="text-xs text-muted-foreground mt-1">Spendable / lendable now</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Currently Lent Out
                </p>
                <HandCoins className="size-4 text-primary" />
              </div>
              <p className="text-2xl font-bold font-heading mt-2">
                ৳{fund.outstandingLoanPrincipal.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Owed back on active loans</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Total Repaid
                </p>
                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold font-heading mt-2 text-green-700 dark:text-green-400">
                ৳{fund.totalLoanRepaid.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Money returned to the fund</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Written Off</p>
                <AlertTriangle
                  className={`size-4 ${fund.totalLoansWrittenOff > 0 ? "text-destructive" : "text-muted-foreground/50"}`}
                />
              </div>
              <p
                className={`text-2xl font-bold font-heading mt-2 ${
                  fund.totalLoansWrittenOff > 0 ? "text-destructive" : ""
                }`}
              >
                ৳{fund.totalLoansWrittenOff.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Accepted as unrecoverable</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/loans${tab.value ? `?status=${tab.value}` : ""}`}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              !overdue && status === tab.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
        <Link
          href="/dashboard/loans?overdue=true"
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            overdue
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Overdue
          {overdueCount > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {overdueCount}
            </Badge>
          )}
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="size-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading loans…</p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-6 text-center">
          <AlertCircle className="size-8 mx-auto text-destructive mb-2" />
          <p className="text-sm font-medium text-destructive">Failed to load loans</p>
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
                      "Borrower",
                      "Amount",
                      "Repaid",
                      "Outstanding",
                      "Status",
                      "Due",
                      "Proposed By",
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
                  {loans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        <HandCoins className="size-8 mx-auto mb-2 opacity-30" />
                        No loans{" "}
                        {overdue ? "are overdue" : status ? `with status "${status}"` : "yet"}
                      </td>
                    </tr>
                  ) : (
                    loans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          <Link
                            href={`/dashboard/loans/${loan._id}`}
                            className="text-primary hover:underline font-semibold"
                          >
                            {loan.borrowerName}
                          </Link>
                          {loan.borrowerMemberId && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Member
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          ৳{loan.principal.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-green-700 dark:text-green-400">
                          ৳{repaidTotal(loan).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {loan.status === "active" ? (
                            `৳${outstandingOf(loan).toLocaleString()}`
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <LoanStatusBadge status={loan.status} />
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {mounted ? (
                            <span
                              className={
                                isOverdue(loan)
                                  ? "text-destructive font-medium"
                                  : "text-muted-foreground"
                              }
                            >
                              {new Date(loan.expectedReturnDate).toLocaleDateString("en-BD")}
                              {isOverdue(loan) && " (overdue)"}
                            </span>
                          ) : (
                            "…"
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {adminName(loan.proposedBy) ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

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

      <ProposeLoanDialog
        open={proposeOpen}
        onClose={() => setProposeOpen(false)}
        availableBalance={fund?.availableBalance ?? null}
      />
    </div>
  );
}
