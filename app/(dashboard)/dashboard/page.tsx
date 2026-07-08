/* eslint-disable no-nested-ternary */
"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList,
  Users,
  Banknote,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useFetchDashboardStats } from "@/features/dashboard/hook/dashboardHooks";

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  accent,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  href: string;
  accent?: "warning" | "success" | "default";
}) {
  return (
    <Link href={href} className="block group">
      <Card className="h-full transition-all duration-200 hover:border-primary/40 hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div
            className={`flex size-9 items-center justify-center rounded-lg ${
              accent === "warning"
                ? "bg-yellow-100 dark:bg-yellow-900/30"
                : accent === "success"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-primary/10"
            }`}
          >
            <Icon
              className={`size-4 ${
                accent === "warning"
                  ? "text-yellow-600 dark:text-yellow-400"
                  : accent === "success"
                    ? "text-green-600 dark:text-green-400"
                    : "text-primary"
              }`}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold font-heading text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          <div className="mt-4 flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
            View <ArrowRight className="size-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Quick action card ────────────────────────────────────────────────────────

function QuickAction({
  href,
  icon: Icon,
  label,
  desc,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
        <Icon className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: stats, isLoading, isError, error } = useFetchDashboardStats();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(new Date());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const greeting = !now
    ? "Good day"
    : now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  const dateStr = now ? now.toLocaleDateString("en-BD", { dateStyle: "full" }) : "Loading date…";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading dashboard statistics…</p>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="max-w-md mx-auto mt-10 rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-6 text-center">
        <AlertCircle className="size-8 mx-auto text-destructive mb-2" />
        <p className="text-sm font-medium text-destructive">Failed to load stats</p>
        <p className="text-xs text-destructive/80 mt-1">
          {error instanceof Error ? error.message : "An error occurred."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2>{greeting}, Admin 👋</h2>
          <p className="text-muted-foreground mt-1">
            Foundation overview for{" "}
            <span className="text-foreground font-medium">{stats.currentPeriodLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Calendar className="size-3.5" />
          <span>{dateStr}</span>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending Applications"
          value={stats.pendingApplications}
          subtitle="Awaiting admin review"
          icon={ClipboardList}
          href="/dashboard/applications?status=pending"
          accent={stats.pendingApplications > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Active Members"
          value={stats.activeMembers}
          subtitle="Currently enrolled members"
          icon={Users}
          href="/dashboard/members?status=active"
          accent="success"
        />
        <StatCard
          title="Collected This Period"
          value={`৳${stats.totalCollectedThisPeriod.toLocaleString()}`}
          subtitle={`Period: ${stats.currentPeriodLabel}`}
          icon={Banknote}
          href="/dashboard/contributions"
        />
        <StatCard
          title="Defaulters"
          value={stats.defaultersCount}
          subtitle={`No payment for ${stats.currentPeriodLabel}`}
          icon={AlertTriangle}
          href="/dashboard/contributions?view=defaulters"
          accent={stats.defaultersCount > 0 ? "warning" : "default"}
        />
      </div>

      <Separator />

      {/* ── Quick actions ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Quick Actions</h3>
          {stats.pendingApplications > 0 && (
            <Badge variant="secondary" className="text-xs">
              {stats.pendingApplications} need attention
            </Badge>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            href="/dashboard/applications?status=pending"
            icon={ClipboardList}
            label="Review Applications"
            desc={`${stats.pendingApplications} pending application${stats.pendingApplications !== 1 ? "s" : ""}`}
          />
          <QuickAction
            href="/dashboard/contributions/new"
            icon={Banknote}
            label="Record Contribution"
            desc="Log a member cash payment"
          />
          <QuickAction
            href="/dashboard/members"
            icon={Users}
            label="View All Members"
            desc={`${stats.activeMembers} active member${stats.activeMembers !== 1 ? "s" : ""}`}
          />
          <QuickAction
            href="/dashboard/reports"
            icon={TrendingUp}
            label="Generate Report"
            desc="Monthly summary & CSV export"
          />
        </div>
      </div>

      {/* ── Status summary ── */}
      {stats.defaultersCount > 0 && (
        <div className="flex items-start gap-4 rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-5">
          <AlertTriangle className="size-5 shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              {stats.defaultersCount} member{stats.defaultersCount !== 1 ? "s" : ""} haven&apos;t
              paid for {stats.currentPeriodLabel}
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Review the contributions section to see who is missing a payment this period.
            </p>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="shrink-0 border-yellow-300 hover:bg-yellow-100 dark:border-yellow-700 dark:hover:bg-yellow-900/40"
          >
            <Link href="/dashboard/contributions?view=defaulters">View defaulters</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
