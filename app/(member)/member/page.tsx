/* eslint-disable no-nested-ternary */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Banknote, CalendarDays, Loader2, LogOut, TrendingUp, User, Users } from "lucide-react";

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

export default function MemberPortalPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useFetchMyProfile();
  const { data: contribData, isLoading: isContribLoading } = useFetchMyContributions({
    page,
    limit: 25,
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
        <p className="text-sm text-muted-foreground">Loading your portal…</p>
      </div>
    );
  }

  const contributions = contribData?.contributions ?? [];
  const myTotalPaid = contribData?.myTotalPaid ?? 0;
  const total = contribData?.total ?? 0;
  const totalPages = contribData?.totalPages ?? 1;

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
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {profile.memberCode}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {profile.contributionType} · ৳{profile.contributionAmount.toLocaleString()}
              </Badge>
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="My Total Paid"
          value={`৳${myTotalPaid.toLocaleString()}`}
          sub={`${total} payment${total === 1 ? "" : "s"} recorded`}
          icon={Banknote}
        />
        <StatTile
          label="Collected This Month"
          value={stats ? `৳${stats.collectedThisPeriod.toLocaleString()}` : "—"}
          sub={stats ? formatPeriodLabel(stats.currentPeriodLabel) : "Loading…"}
          icon={CalendarDays}
        />
        <StatTile
          label="Collected All Time"
          value={stats ? `৳${stats.collectedAllTime.toLocaleString()}` : "—"}
          sub={stats ? `${stats.activeMembers} active members together` : "Loading…"}
          icon={TrendingUp}
        />
      </div>

      {/* My contributions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              My Contribution History
            </h3>
            <Users className="size-4 text-muted-foreground/50" />
          </div>

          {isContribLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 text-primary animate-spin" />
            </div>
          ) : contributions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Banknote className="size-8 opacity-30 mb-2" />
              <p className="text-sm">No contributions recorded yet.</p>
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
                    Page {page} of {totalPages}
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
        This portal is read-only. If anything looks wrong, please contact a foundation admin.
      </p>
    </div>
  );
}
