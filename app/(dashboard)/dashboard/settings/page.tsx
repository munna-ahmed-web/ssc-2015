"use client";

import { useState, useEffect } from "react";
import { Shield, Key, History, FileText, Banknote, User, Loader2, AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFetchAdminProfile, useFetchAuditLogs } from "@/features/settings/hook/settingsHooks";

export default function SettingsPage() {
  const {
    data: admin,
    isLoading: isAdminLoading,
    isError: isAdminError,
    error: adminError,
  } = useFetchAdminProfile();

  const {
    data: logs = [],
    isLoading: isLogsLoading,
    isError: isLogsError,
    error: logsError,
  } = useFetchAuditLogs();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const isLoading = isAdminLoading || isLogsLoading;
  const isError = isAdminError || isLogsError;
  const error = adminError || logsError;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading settings & audit logs…</p>
      </div>
    );
  }

  if (isError || !admin) {
    return (
      <div className="max-w-md mx-auto mt-10 rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-6 text-center">
        <AlertCircle className="size-8 mx-auto text-destructive mb-2" />
        <p className="text-sm font-medium text-destructive">Failed to load settings data</p>
        <p className="text-xs text-destructive/80 mt-1">
          {error instanceof Error ? error.message : "An error occurred."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Settings & Audit Logs</h2>
        <p className="text-muted-foreground mt-1">
          Review your administrative profile and inspect system audit records
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Admin Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <User className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{admin.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Role</span>
                  <Badge variant="outline" className="capitalize text-xs">
                    {admin.role}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-green-700 dark:text-green-400">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created On</span>
                  <span>
                    {mounted
                      ? new Date(admin.createdAt).toLocaleDateString("en-BD", {
                          dateStyle: "medium",
                        })
                      : "Loading date…"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                System Info & Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-primary shrink-0" />
                <span>
                  Edge Auth Guard: <span className="font-semibold text-foreground">Enabled</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="size-4 text-primary shrink-0" />
                <span>
                  Session Expiry: <span className="font-semibold text-foreground">15 Minutes</span>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Logs Chronological Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Security Audit Timeline
            </CardTitle>
            <Badge variant="secondary" className="gap-1">
              <History className="size-3" />
              Recent Actions
            </Badge>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <History className="size-8 opacity-30 mb-2" />
                <p className="text-sm">No action logs found yet.</p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {logs.map((log, index) => (
                    <li key={log.id}>
                      <div className="relative pb-8">
                        {index !== logs.length - 1 && (
                          <span
                            className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-border"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span
                              className={`flex size-8 items-center justify-center rounded-full ring-8 ring-card ${
                                log.type === "application"
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                  : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                              }`}
                            >
                              {log.type === "application" ? (
                                <FileText className="size-4" />
                              ) : (
                                <Banknote className="size-4" />
                              )}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between gap-4">
                            <div>
                              <p className="text-sm text-foreground">
                                <span className="font-semibold">{log.action}</span> for{" "}
                                <span className="font-medium text-primary">{log.targetName}</span>
                              </p>
                              {log.details && (
                                <p className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded px-2.5 py-1 border border-border/50 w-fit">
                                  {log.details}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Performed by:{" "}
                                <span className="font-medium text-foreground">
                                  {log.performedBy}
                                </span>
                              </p>
                            </div>
                            <div className="text-right text-xs text-muted-foreground shrink-0">
                              {mounted ? (
                                <time dateTime={new Date(log.timestamp).toISOString()}>
                                  {new Date(log.timestamp).toLocaleDateString("en-BD", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                  {" at "}
                                  {new Date(log.timestamp).toLocaleTimeString("en-BD", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </time>
                              ) : (
                                <span>Loading time…</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
