import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Users,
  Banknote,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { connectDB } from "@/lib/db";
import { Contribution, Member } from "@/models";
import { getPeriodLabel } from "@/types";
import { getRecentPeriods, formatPeriodLabel } from "@/lib/periods";

export const metadata = { title: "Reports — SSC-2015 Foundation Admin" };

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getReportData(periodLabel: string) {
  await connectDB();

  const activeMembers = await Member.find({ status: "active" })
    .select("_id fullName memberCode phone contributionType contributionAmount")
    .sort({ memberCode: 1 })
    .lean();

  const contributions = await Contribution.find({ periodLabel, isReversal: false })
    .select("memberId amount paidAt notes")
    .lean();

  const paidMap = new Map(contributions.map((c) => [c.memberId.toString(), c]));

  const breakdown = activeMembers.map((m) => {
    const paid = paidMap.get(m._id.toString());
    return {
      memberId: m._id.toString(),
      memberCode: m.memberCode,
      fullName: m.fullName,
      phone: m.phone,
      contributionType: m.contributionType as string,
      expectedAmount: m.contributionAmount,
      paid: !!paid,
      actualAmount: paid?.amount ?? null,
      paidAt: paid ? new Date(paid.paidAt) : null,
      notes: paid?.notes ?? null,
    };
  });

  const paidCount = breakdown.filter((r) => r.paid).length;
  const defaultersCount = breakdown.length - paidCount;
  const totalCollected = breakdown
    .filter((r) => r.paid)
    .reduce((s, r) => s + (r.actualAmount ?? 0), 0);
  const expectedTotal = breakdown.reduce((s, r) => s + r.expectedAmount, 0);
  const collectionRate =
    breakdown.length > 0 ? Math.round((paidCount / breakdown.length) * 100) : 0;

  return {
    breakdown,
    paidCount,
    defaultersCount,
    totalCollected,
    expectedTotal,
    collectionRate,
    activeCount: activeMembers.length,
  };
}

// ─── Summary stat card ────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "green" | "red" | "default";
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            <p
              className={`text-2xl font-bold font-heading mt-1 ${
                accent === "green"
                  ? "text-green-700 dark:text-green-400"
                  : accent === "red"
                    ? "text-red-600 dark:text-red-400"
                    : "text-foreground"
              }`}
            >
              {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div
            className={`flex size-9 items-center justify-center rounded-lg ${
              accent === "green"
                ? "bg-green-100 dark:bg-green-900/30"
                : accent === "red"
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-primary/10"
            }`}
          >
            <Icon
              className={`size-4 ${
                accent === "green"
                  ? "text-green-600 dark:text-green-400"
                  : accent === "red"
                    ? "text-red-600 dark:text-red-400"
                    : "text-primary"
              }`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const allPeriods = [...getRecentPeriods("monthly", 12), ...getRecentPeriods("weekly", 12)];

  const defaultPeriod = getPeriodLabel("monthly");
  const period = sp.period ?? defaultPeriod;

  const {
    breakdown,
    paidCount,
    defaultersCount,
    totalCollected,
    expectedTotal,
    collectionRate,
    activeCount,
  } = await getReportData(period);

  const paidRows = breakdown.filter((r) => r.paid);
  const unpaidRows = breakdown.filter((r) => !r.paid);

  // Collection progress bar fill
  const progressPct = Math.min(100, collectionRate);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Monthly Summary Report</h2>
          <p className="text-muted-foreground mt-1">Per-member payment breakdown for any period</p>
        </div>

        {/* Period selector */}
        <form method="GET" className="flex gap-2 items-center">
          <select
            name="period"
            defaultValue={period}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-ring"
          >
            {allPeriods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            View
          </button>
        </form>
      </div>

      {/* Period banner */}
      <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 px-5 py-3">
        <BarChart3 className="size-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Report for {formatPeriodLabel(period)}
          </p>
          <p className="text-xs text-muted-foreground">
            Period code: <code>{period}</code>
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Banknote}
          label="Total Collected"
          value={`৳${totalCollected.toLocaleString()}`}
          sub={`of ৳${expectedTotal.toLocaleString()} expected`}
          accent="green"
        />
        <StatCard
          icon={Users}
          label="Members Paid"
          value={paidCount}
          sub={`out of ${activeCount} active members`}
          accent="green"
        />
        <StatCard
          icon={AlertTriangle}
          label="Defaulters"
          value={defaultersCount}
          sub="active members with no payment"
          accent={defaultersCount > 0 ? "red" : "default"}
        />
        <StatCard
          icon={TrendingUp}
          label="Collection Rate"
          value={`${collectionRate}%`}
          sub="of active members paid"
        />
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-medium">Collection Progress</span>
            <span className="text-muted-foreground">
              {paidCount} / {activeCount} members
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progressPct === 100
                  ? "bg-green-500"
                  : progressPct >= 75
                    ? "bg-primary"
                    : progressPct >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span>0%</span>
            <span className="font-medium text-foreground">{collectionRate}% collected</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* ─── Per-member breakdown ─────────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold mb-4">Member Payment Breakdown</h3>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {["Code", "Member", "Frequency", "Expected", "Status", "Paid On", "Amount"].map(
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
                {breakdown.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      No active members found.
                    </td>
                  </tr>
                ) : (
                  breakdown.map((row) => (
                    <tr
                      key={row.memberId}
                      className={`transition-colors ${
                        row.paid
                          ? "hover:bg-muted/20"
                          : "hover:bg-red-50/50 dark:hover:bg-red-900/10"
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-primary">{row.memberCode}</td>
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/dashboard/members/${row.memberId}`}
                          className="hover:text-primary transition-colors"
                        >
                          {row.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs capitalize">
                          {row.contributionType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">৳{row.expectedAmount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {row.paid ? (
                          <span className="flex items-center gap-1.5 text-green-700 dark:text-green-400 text-xs font-medium">
                            <CheckCircle2 className="size-3.5" />
                            Paid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-medium">
                            <XCircle className="size-3.5" />
                            Defaulted
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {row.paidAt ? row.paidAt.toLocaleDateString("en-BD") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {row.actualAmount != null ? (
                          <span className="font-semibold text-green-700 dark:text-green-400">
                            ৳{row.actualAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Defaulters section ───────────────────────────────────────────────── */}
      {unpaidRows.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-base font-semibold">Defaulters</h3>
            <Badge variant="destructive">{unpaidRows.length}</Badge>
          </div>
          <div className="rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
            <div className="bg-red-50 dark:bg-red-900/20 px-4 py-2.5 border-b border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
              These members have not paid for {formatPeriodLabel(period)}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Code", "Member", "Phone", "Frequency", "Expected Amount", ""].map((h) => (
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
                  {unpaidRows.map((row) => (
                    <tr key={row.memberId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-primary">{row.memberCode}</td>
                      <td className="px-4 py-3 font-medium">{row.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.phone}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs capitalize">
                          {row.contributionType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">৳{row.expectedAmount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/contributions/new`}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Record payment <ArrowRight className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* All paid celebration */}
      {unpaidRows.length === 0 && breakdown.length > 0 && (
        <div className="flex items-center gap-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-5 py-4">
          <CheckCircle2 className="size-6 text-green-600 dark:text-green-400 shrink-0" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-200">
              100% collection rate for {formatPeriodLabel(period)}!
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
              All {paidCount} active members have paid for this period.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
