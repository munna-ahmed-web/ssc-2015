/* eslint-disable no-nested-ternary */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { History, Loader2, AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFetchActivityLogs } from "@/features/activity/hook/activityHooks";
import {
  ACTION_LABELS,
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_BADGE_CLASSES,
} from "@/features/activity/types/types";
import type { SerializedActivityLog } from "@/features/activity/types/types";
import type { AuditEntityType } from "@/models/AuditLog";

const LIMIT = 25;

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

/** Compact renderer for the Details column */
function ActivityDetails({ log }: { log: SerializedActivityLog }) {
  const details = log.details;
  if (!details || Object.keys(details).length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  // Field diff (member edits, image updates): "field: from → to"
  const changes = details.changes as Record<string, unknown> | undefined;
  if (changes && Object.keys(changes).length > 0) {
    return (
      <div className="space-y-0.5">
        {Object.entries(changes).map(([field, change]) => {
          const diff = change as { from?: unknown; to?: unknown };
          const isDiff = typeof change === "object" && change !== null && "to" in change;
          return (
            <p key={field} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{field}</span>
              {": "}
              {isDiff ? (
                <>
                  {formatDetailValue(diff.from)} → {formatDetailValue(diff.to)}
                </>
              ) : (
                formatDetailValue(change)
              )}
            </p>
          );
        })}
      </div>
    );
  }

  // Contextual facts (amount, periodLabel, rejectionReason, …)
  const facts = Object.entries(details).filter(([key]) => key !== "memberId");
  return (
    <div className="space-y-0.5">
      {facts.map(([key, value]) => (
        <p key={key} className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{key}</span>
          {": "}
          {key === "amount" ? `৳${formatDetailValue(value)}` : formatDetailValue(value)}
        </p>
      ))}
    </div>
  );
}

export default function ActivityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Avoid SSR hydration mismatch for locale-formatted times
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const actorId = searchParams.get("actorId") ?? "";
  const entityType = searchParams.get("entityType") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));

  const { data, isLoading, isError, error } = useFetchActivityLogs({
    actorId: actorId || undefined,
    entityType: (entityType || undefined) as AuditEntityType | undefined,
    page,
    limit: LIMIT,
  });

  const logs = data?.logs ?? [];
  const actors = data?.actors ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const limit = data?.limit ?? LIMIT;

  const buildHref = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    if (actorId) params.set("actorId", actorId);
    if (entityType) params.set("entityType", entityType);
    params.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    return `/dashboard/activity?${params.toString()}`;
  };

  const handleFilterChange = (key: "actorId" | "entityType", value: string) => {
    router.push(buildHref({ [key]: value, page: "1" }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Activity Log</h2>
        <p className="text-muted-foreground mt-1">
          Full history of admin actions — who did what, and when
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <select
          name="actorId"
          value={actorId}
          onChange={(e) => handleFilterChange("actorId", e.target.value)}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-ring"
        >
          <option value="">All admins</option>
          {actors.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>

        <select
          name="entityType"
          value={entityType}
          onChange={(e) => handleFilterChange("entityType", e.target.value)}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-ring"
        >
          <option value="">All activity</option>
          {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="size-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading activity…</p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-6 text-center">
          <AlertCircle className="size-8 mx-auto text-destructive mb-2" />
          <p className="text-sm font-medium text-destructive">Failed to load activity log</p>
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
                    {["Time", "Admin", "Action", "Target", "Details"].map((h) => (
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
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        <History className="size-8 mx-auto mb-2 opacity-30" />
                        No activity recorded yet
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {mounted ? (
                            <time dateTime={log.createdAt}>
                              {new Date(log.createdAt).toLocaleDateString("en-BD")}{" "}
                              {new Date(log.createdAt).toLocaleTimeString("en-BD", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </time>
                          ) : (
                            "…"
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{log.actorName}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-xs border-transparent ${ENTITY_TYPE_BADGE_CLASSES[log.entityType]}`}
                          >
                            {ACTION_LABELS[log.action]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{log.entityLabel ?? "—"}</td>
                        <td className="px-4 py-3 max-w-72">
                          <ActivityDetails log={log} />
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
    </div>
  );
}
