/* eslint-disable no-nested-ternary */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Banknote, Plus, Users, Loader2, AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPeriodLabel } from "@/types";
import { formatPeriodLabel } from "@/lib/periods";
import { ContributionRowActions } from "@/features/contributions/ContributionRowActions";
import {
  useFetchLedger,
  useFetchDefaulters,
} from "@/features/contributions/hook/contributionHooks";

const VIEW_TABS = [
  { label: "Ledger", value: "ledger" },
  { label: "Defaulters", value: "defaulters" },
];

export default function ContributionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [periodOptions] = useState(() => {
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const v = getPeriodLabel("monthly", d);
      return { value: v, label: formatPeriodLabel(v) };
    });

    const nowMs = Date.now();
    const weekly = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(nowMs - i * 7 * 86400000);
      const v = getPeriodLabel("weekly", d);
      return { value: v, label: formatPeriodLabel(v) };
    });

    return [...monthly, ...weekly];
  });

  const view = searchParams.get("view") ?? "ledger";
  const currentPeriod = getPeriodLabel("monthly");
  const period = searchParams.get("period") ?? currentPeriod;
  const includeReversals = searchParams.get("includeReversals") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));

  // Fetch Ledger data if view is ledger
  const {
    data: ledgerData,
    isLoading: isLedgerLoading,
    isError: isLedgerError,
    error: ledgerError,
  } = useFetchLedger({
    periodLabel: period,
    includeReversals,
    page,
    limit: 25,
  });

  // Always fetch Defaulters to show the count badge on the tab
  const {
    data: defaultersData,
    isLoading: isDefaultersLoading,
    isError: isDefaultersError,
    error: defaultersError,
  } = useFetchDefaulters({
    periodLabel: period,
  });

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", e.target.value);
    params.set("page", "1"); // Reset page on period change
    router.push(`/dashboard/contributions?${params.toString()}`);
  };

  const activeLoading = view === "ledger" ? isLedgerLoading : isDefaultersLoading;
  const activeError = view === "ledger" ? isLedgerError : isDefaultersError;
  const error = view === "ledger" ? ledgerError : defaultersError;

  const contributions = ledgerData?.contributions ?? [];
  const total = ledgerData?.total ?? 0;
  const totalPages = ledgerData?.totalPages ?? 1;
  const limit = ledgerData?.limit ?? 25;
  const netCollected = ledgerData?.netCollected ?? 0;
  const defaulters = defaultersData ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Contribution Ledger</h2>
          <p className="text-muted-foreground mt-1">
            Append-only financial records with full audit trail
          </p>
        </div>
        <Button asChild className="gap-2 self-start sm:self-center">
          <Link href="/dashboard/contributions/new">
            <Plus className="size-4" />
            Record Contribution
          </Link>
        </Button>
      </div>

      {/* Period selector & view tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-2 items-center">
          <select
            name="period"
            value={period}
            onChange={handlePeriodChange}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-ring"
          >
            {periodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* View tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg ml-auto">
          {VIEW_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/dashboard/contributions?view=${tab.value}&period=${period}`}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === tab.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.value === "defaulters" && defaulters.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {defaulters.length}
                </Badge>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Summary card (ledger view) */}
      {view === "ledger" && !activeLoading && !activeError && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Period</p>
              <p className="text-lg font-semibold mt-1">{formatPeriodLabel(period)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Entries</p>
              <p className="text-lg font-semibold mt-1">{total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Net Collected</p>
              <p className="text-lg font-semibold mt-1 text-green-700 dark:text-green-400">
                ৳{netCollected.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="size-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading contributions data…</p>
        </div>
      ) : activeError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-6 text-center">
          <AlertCircle className="size-8 mx-auto text-destructive mb-2" />
          <p className="text-sm font-medium text-destructive">Failed to load contributions</p>
          <p className="text-xs text-destructive/80 mt-1">
            {error instanceof Error ? error.message : "An error occurred."}
          </p>
        </div>
      ) : (
        <>
          {/* ─── LEDGER TABLE ─────────────────────────────────────────────────────── */}
          {view === "ledger" && (
            <>
              <div className="flex items-center gap-3">
                <Link
                  href={`/dashboard/contributions?view=ledger&period=${period}&includeReversals=${!includeReversals}`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeReversals}
                      readOnly
                      className="rounded border-input text-primary focus:ring-ring"
                    />
                    Include reversed entries & reversals in ledger
                  </label>
                </Link>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        {["Member", "Period", "Amount", "Type", "Paid On", "Notes", ""].map((h) => (
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
                      {contributions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                            <Banknote className="size-8 mx-auto mb-2 opacity-30" />
                            No ledger entries found for this period
                          </td>
                        </tr>
                      ) : (
                        contributions.map((c) => {
                          return (
                            <tr
                              key={c._id}
                              className={`hover:bg-muted/30 transition-colors ${
                                c.isReversal ? "opacity-60" : ""
                              }`}
                            >
                              <td className="px-4 py-3 font-medium">
                                <Link
                                  href={`/dashboard/members/${c.memberId}`}
                                  className="text-primary hover:underline font-semibold"
                                >
                                  {c.memberName}
                                </Link>
                              </td>
                              <td className="px-4 py-3">
                                {formatPeriodLabel(c.periodLabel)}
                                {c.isReversal && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-xs text-red-500 border-red-300"
                                  >
                                    Reversal
                                  </Badge>
                                )}
                                {c.reversalOf && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-xs text-amber-500 border-amber-300"
                                  >
                                    Reversed
                                  </Badge>
                                )}
                              </td>
                              <td
                                className={`px-4 py-3 font-semibold ${
                                  c.isReversal ? "text-red-600 dark:text-red-400" : ""
                                }`}
                              >
                                {c.isReversal ? "−" : ""}৳{c.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 capitalize">
                                <Badge variant="outline" className="text-xs">
                                  {c.contributionType}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">
                                {new Date(c.paidAt).toLocaleDateString("en-BD")}
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-40">
                                {c.notes ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <ContributionRowActions contribution={c} />
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
                          href={`/dashboard/contributions?view=ledger&period=${period}&includeReversals=${includeReversals}&page=${
                            page - 1
                          }`}
                        >
                          Previous
                        </Link>
                      </Button>
                    )}
                    {page < totalPages && (
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/dashboard/contributions?view=ledger&period=${period}&includeReversals=${includeReversals}&page=${
                            page + 1
                          }`}
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

          {/* ─── DEFAULTERS TABLE ─────────────────────────────────────────────────── */}
          {view === "defaulters" && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {["Code", "Name", "Phone", "Frequency", "Premium Amount", ""].map((h) => (
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
                    {defaulters.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                          <Users className="size-8 mx-auto mb-2 opacity-30" />
                          No defaulters for this period. Excellent!
                        </td>
                      </tr>
                    ) : (
                      defaulters.map((m) => {
                        return (
                          <tr key={m._id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-semibold text-primary">{m.memberCode}</td>
                            <td className="px-4 py-3 font-medium">
                              <Link
                                href={`/dashboard/members/${m._id}`}
                                className="text-primary hover:underline font-semibold"
                              >
                                {m.fullName}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{m.phone}</td>
                            <td className="px-4 py-3 capitalize">
                              <Badge variant="outline" className="text-xs">
                                {m.contributionType}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">৳{m.contributionAmount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                              <Button asChild size="xs" variant="outline">
                                <Link href={`/dashboard/contributions/new?memberId=${m._id}`}>
                                  Record
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
          )}
        </>
      )}
    </div>
  );
}
