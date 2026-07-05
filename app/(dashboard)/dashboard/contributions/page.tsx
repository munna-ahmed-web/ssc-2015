import Link from "next/link";
import { Banknote, Plus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { connectDB } from "@/lib/db";
import { Contribution, Member } from "@/models";
import type { IContribution } from "@/models";
import { getPeriodLabel } from "@/types";
import { formatPeriodLabel } from "@/lib/periods";
import { ContributionRowActions } from "@/features/contributions/ContributionRowActions";

export const metadata = { title: "Contributions — SSC-2015 Foundation Admin" };

const VIEW_TABS = [
  { label: "Ledger", value: "ledger" },
  { label: "Defaulters", value: "defaulters" },
];

async function getLedger(periodLabel: string, includeReversals: boolean, page: number) {
  await connectDB();
  const limit = 25;
  const filter: Record<string, unknown> = { periodLabel };
  if (!includeReversals) filter.isReversal = false;

  const [contributions, total, periodTotal] = await Promise.all([
    Contribution.find(filter)
      .sort({ paidAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Contribution.countDocuments(filter),
    // Net collected this period (subtract reversals)
    Contribution.aggregate([
      { $match: { periodLabel } },
      {
        $group: {
          _id: null,
          net: { $sum: { $cond: ["$isReversal", { $multiply: ["$amount", -1] }, "$amount"] } },
        },
      },
    ]),
  ]);

  return {
    contributions,
    total,
    limit,
    netCollected: periodTotal[0]?.net ?? 0,
  };
}

async function getDefaulters(periodLabel: string) {
  await connectDB();
  const activeMembers = await Member.find({ status: "active" })
    .select("_id fullName memberCode phone contributionType contributionAmount")
    .lean();
  const paid = await Contribution.find({ periodLabel, isReversal: false })
    .select("memberId")
    .lean();
  const paidSet = new Set(paid.map((c) => c.memberId.toString()));
  return activeMembers.filter((m) => !paidSet.has(m._id.toString()));
}

interface PageProps {
  searchParams: Promise<{
    view?: string;
    period?: string;
    includeReversals?: string;
    page?: string;
  }>;
}

export default async function ContributionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const view = sp.view ?? "ledger";
  const currentPeriod = getPeriodLabel("monthly");
  const period = sp.period ?? currentPeriod;
  const includeReversals = sp.includeReversals === "true";
  const page = Math.max(1, parseInt(sp.page ?? "1"));

  const { contributions, total, limit, netCollected } =
    view === "ledger"
      ? await getLedger(period, includeReversals, page)
      : { contributions: [], total: 0, limit: 25, netCollected: 0 };
  const defaulters = view === "defaulters" ? await getDefaulters(period) : [];
  const totalPages = Math.ceil(total / limit);

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
        <form method="GET" className="flex gap-2 items-center">
          <input type="hidden" name="view" value={view} />
          <select
            name="period"
            defaultValue={period}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-ring"
          >
            {/* Generate 12 monthly + 12 weekly periods for flexibility */}
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const v = getPeriodLabel("monthly", d);
              return (
                <option key={v} value={v}>
                  {formatPeriodLabel(v)}
                </option>
              );
            })}
            {Array.from({ length: 12 }, (_, i) => {
              // eslint-disable-next-line react-hooks/purity
              const d = new Date(Date.now() - i * 7 * 86400000);
              const v = getPeriodLabel("weekly", d);
              return (
                <option key={v} value={v}>
                  {formatPeriodLabel(v)}
                </option>
              );
            })}
          </select>
          <Button type="submit" size="sm" variant="outline">
            Apply
          </Button>
        </form>

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
      {view === "ledger" && (
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

      {/* ─── LEDGER TABLE ─────────────────────────────────────────────────────── */}
      {view === "ledger" && (
        <>
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/contributions?view=ledger&period=${period}&includeReversals=${!includeReversals}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {includeReversals ? "▼ Hide reversals" : "▶ Show reversals"}
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
                        No contributions for this period
                      </td>
                    </tr>
                  ) : (
                    contributions.map((c) => {
                      const contrib = c as unknown as IContribution & {
                        _id: { toString(): string };
                        createdAt: Date;
                      };
                      return (
                        <tr
                          key={contrib._id.toString()}
                          className={`hover:bg-muted/30 transition-colors ${contrib.isReversal ? "opacity-60" : ""}`}
                        >
                          <td className="px-4 py-3 font-medium">
                            {contrib.memberName}
                            {contrib.isReversal && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs text-red-500 border-red-300"
                              >
                                Reversal
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatPeriodLabel(contrib.periodLabel)}
                          </td>
                          <td
                            className={`px-4 py-3 font-semibold ${contrib.isReversal ? "text-red-600 dark:text-red-400" : ""}`}
                          >
                            {contrib.isReversal ? "−" : ""}৳{contrib.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs capitalize">
                              {contrib.contributionType}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {new Date(contrib.paidAt).toLocaleDateString("en-BD")}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-32 truncate">
                            {contrib.notes ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <ContributionRowActions contribution={contrib} />
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
                      href={`/dashboard/contributions?view=ledger&period=${period}&page=${page - 1}`}
                    >
                      Previous
                    </Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={`/dashboard/contributions?view=ledger&period=${period}&page=${page + 1}`}
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
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Active members with no payment for{" "}
              <span className="text-foreground font-medium">{formatPeriodLabel(period)}</span>
            </p>
            <Badge variant="destructive">
              {defaulters.length} defaulter{defaulters.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {["Code", "Member", "Phone", "Frequency", "Expected Amount"].map((h) => (
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
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <Users className="size-8 mx-auto mb-2 opacity-30" />
                      All active members have paid for this period 🎉
                    </td>
                  </tr>
                ) : (
                  defaulters.map((m) => (
                    <tr key={m._id.toString()} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-primary">{m.memberCode}</td>
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/dashboard/members/${m._id.toString()}`}
                          className="hover:text-primary transition-colors"
                        >
                          {m.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.phone}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs capitalize">
                          {m.contributionType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">৳{m.contributionAmount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
