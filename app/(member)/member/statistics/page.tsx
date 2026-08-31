/* eslint-disable no-nested-ternary */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Loader2,
  LogOut,
  Phone,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPeriodLabel } from "@/lib/periods";
import {
  useFetchMyProfile,
  useFetchMyContributions,
  useFetchMemberStats,
  useMemberLogout,
} from "@/features/member-portal/hook/memberPortalHooks";

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <Icon className="size-4 text-primary" />
        </div>
        <p className="text-2xl font-bold font-heading mt-2">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default function MemberStatisticsPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [yearFilter, setYearFilter] = useState<string>("");
  const [showReversals, setShowReversals] = useState(true);

  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useFetchMyProfile();
  const { data: contribData, isLoading: isContribLoading } = useFetchMyContributions({
    page,
    limit: 25,
    year: yearFilter ? parseInt(yearFilter) : undefined,
    includeReversals: showReversals,
  });
  const { data: stats } = useFetchMemberStats();
  const { mutateAsync: logout, isPending: loggingOut } = useMemberLogout();

  // Avoid SSR hydration mismatch for locale-formatted dates
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Not logged in (or session expired) → back to login
  useEffect(() => {
    if (isProfileError) {
      router.replace("/member/login");
    }
  }, [isProfileError, router]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace("/member/login");
    }
  };

  if (isProfileLoading || isProfileError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your statistics…</p>
      </div>
    );
  }

  const contributions = contribData?.contributions ?? [];
  const summary = contribData?.summary;
  const total = contribData?.total ?? 0;
  const totalPages = contribData?.totalPages ?? 1;

  const trend = stats?.monthlyTrend ?? [];
  const trendMax = Math.max(1, ...trend.map((t) => t.total));
  const paidShare =
    stats && stats.activeMembers > 0
      ? Math.round((stats.paidMembersThisPeriod / stats.activeMembers) * 100)
      : 0;

  const handleYearChange = (value: string) => {
    setYearFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile.photoUrl ? (
            <div className="relative size-14 rounded-full overflow-hidden border border-border">
              <Image
                src={profile.photoUrl}
                alt={profile.fullName}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <User className="size-7 text-primary" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold">{profile.fullName}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {profile.memberCode}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {profile.contributionType} · ৳{profile.contributionAmount.toLocaleString()}
              </Badge>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Phone className="size-3" />
                {profile.phone}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <LogOut className="size-3.5" />
          )}
          Log out
        </Button>
      </div>

      {/* Current period status */}
      {summary && (
        <div
          className={`rounded-xl border px-5 py-4 flex items-center gap-3 ${
            summary.currentPeriodPaid
              ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20"
              : "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20"
          }`}
        >
          {summary.currentPeriodPaid ? (
            <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 shrink-0" />
          ) : (
            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <div>
            <p
              className={`text-sm font-semibold ${
                summary.currentPeriodPaid
                  ? "text-green-800 dark:text-green-300"
                  : "text-amber-800 dark:text-amber-300"
              }`}
            >
              {summary.currentPeriodPaid
                ? `Paid for ${formatPeriodLabel(summary.currentPeriodLabel)} ✓`
                : `Not paid yet for ${formatPeriodLabel(summary.currentPeriodLabel)}`}
            </p>
            {!summary.currentPeriodPaid && (
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                Please hand your contribution to a foundation admin.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="My Total Paid"
          value={`৳${(summary?.myTotalPaid ?? 0).toLocaleString()}`}
          sub={`${summary?.paymentsCount ?? 0} payment${(summary?.paymentsCount ?? 0) === 1 ? "" : "s"}${
            summary?.lastPaidAt && mounted
              ? ` · last ${new Date(summary.lastPaidAt).toLocaleDateString("en-BD")}`
              : ""
          }`}
          icon={Banknote}
        />
        <StatTile
          label={`Paid in ${new Date().getFullYear()}`}
          value={`৳${(summary?.thisYearTotal ?? 0).toLocaleString()}`}
          sub="Your contributions this year"
          icon={CalendarDays}
        />
        <StatTile
          label="Collected This Month"
          value={stats ? `৳${stats.collectedThisPeriod.toLocaleString()}` : "—"}
          sub={stats ? formatPeriodLabel(stats.currentPeriodLabel) : "Loading…"}
          icon={TrendingUp}
        />
        <StatTile
          label="Collected All Time"
          value={stats ? `৳${stats.collectedAllTime.toLocaleString()}` : "—"}
          sub={stats ? `${stats.activeMembers} active members together` : "Loading…"}
          icon={Users}
        />
      </div>

      {/* Foundation transparency: participation + trend */}
      {stats && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                This Month&apos;s Participation
              </h3>
              <p className="text-sm mb-2">
                <span className="font-semibold">{stats.paidMembersThisPeriod}</span> of{" "}
                <span className="font-semibold">{stats.activeMembers}</span> members have paid for{" "}
                {formatPeriodLabel(stats.currentPeriodLabel)}
              </p>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${paidShare}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{paidShare}% participation</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Collection — Last 6 Months
              </h3>
              <div className="space-y-2">
                {trend.map((t) => (
                  <div key={t.periodLabel} className="flex items-center gap-3 text-xs">
                    <span className="w-20 shrink-0 text-muted-foreground">
                      {formatPeriodLabel(t.periodLabel)}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.round((t.total / trendMax) * 100)}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right font-medium">
                      ৳{t.total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* My contributions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              My Contribution History
            </h3>
            <div className="flex items-center gap-3">
              <select
                name="year"
                value={yearFilter}
                onChange={(e) => handleYearChange(e.target.value)}
                className="h-8 rounded-lg border border-input bg-card px-2.5 text-xs outline-none focus:border-ring"
              >
                <option value="">All years</option>
                {(summary?.availableYears ?? []).map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={showReversals}
                  onChange={(e) => {
                    setShowReversals(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded border-input text-primary focus:ring-ring"
                />
                Show reversals
              </label>
            </div>
          </div>

          {/* Yearly breakdown chips */}
          {summary && summary.yearlyBreakdown.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {summary.yearlyBreakdown.map((y) => (
                <Badge key={y.year} variant="outline" className="text-xs">
                  {y.year}: ৳{y.total.toLocaleString()}
                </Badge>
              ))}
            </div>
          )}

          {isContribLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 text-primary animate-spin" />
            </div>
          ) : contributions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Banknote className="size-8 opacity-30 mb-2" />
              <p className="text-sm">
                {yearFilter
                  ? `No contributions recorded in ${yearFilter}.`
                  : "No contributions recorded yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        {["Period", "Amount", "Paid On", "Notes"].map((h) => (
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
                      {contributions.map((c) => (
                        <tr
                          key={c._id}
                          className={`hover:bg-muted/30 transition-colors ${c.isReversal ? "opacity-60" : ""}`}
                        >
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
                          </td>
                          <td
                            className={`px-4 py-3 font-semibold ${
                              c.isReversal ? "text-red-600 dark:text-red-400" : ""
                            }`}
                          >
                            {c.isReversal ? "−" : ""}৳{c.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {mounted ? new Date(c.paidAt).toLocaleDateString("en-BD") : "…"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-40">
                            {c.notes ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
                  <span>
                    Page {page} of {totalPages} · {total} entr{total === 1 ? "y" : "ies"}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        This portal is read-only. If any information looks wrong (including your phone number or
        guardian name: {profile.guardianName}), please contact a foundation admin.
      </p>
    </div>
  );
}
