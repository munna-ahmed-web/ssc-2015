/* eslint-disable no-nested-ternary */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Banknote, CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { adminName } from "@/lib/utils";
import InvestmentStatusBadge from "@/features/investments/InvestmentStatusBadge";
import RejectInvestmentDialog from "@/features/investments/RejectInvestmentDialog";
import CloseInvestmentDialog from "@/features/investments/CloseInvestmentDialog";
import {
  useApproveInvestment,
  useFetchInvestment,
} from "@/features/investments/hook/investmentHooks";

function LifecycleRow({
  label,
  name,
  date,
  mounted,
}: {
  label: string;
  name?: string;
  date?: string;
  mounted: boolean;
}) {
  if (!date) return null;
  return (
    <div>
      {label}:{" "}
      <span className="font-medium text-foreground">
        {name ?? "—"}
        {" · "}
        {mounted ? new Date(date).toLocaleDateString("en-BD", { dateStyle: "medium" }) : "…"}
      </span>
    </div>
  );
}

export default function InvestmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data: inv, isLoading, isError, error } = useFetchInvestment(id);
  const { mutateAsync: approve, isPending: approving } = useApproveInvestment();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleApprove = async () => {
    setActionError(null);
    try {
      await approve(id);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading investment…</p>
      </div>
    );
  }

  if (isError || !inv) {
    return (
      <div className="max-w-md mx-auto mt-10 rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-6 text-center">
        <AlertCircle className="size-8 mx-auto text-destructive mb-2" />
        <p className="text-sm font-medium text-destructive">Failed to load investment</p>
        <p className="text-xs text-destructive/80 mt-1">
          {error instanceof Error ? error.message : "An error occurred."}
        </p>
      </div>
    );
  }

  const profit =
    inv.status === "closed" && inv.returnedAmount !== undefined
      ? inv.returnedAmount - inv.principal
      : null;
  const allocatedTotal = inv.profitAllocations.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/dashboard/investments">
            <ArrowLeft className="size-4" />
            Investments
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <h2 className="text-lg">{inv.title}</h2>
        <InvestmentStatusBadge status={inv.status} />
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Admin Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {actionError}
            </div>
          )}

          {inv.status === "pending" && (
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2" onClick={() => void handleApprove()} disabled={approving}>
                {approving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Approve Investment
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setRejectOpen(true)}
              >
                <XCircle className="size-4" />
                Reject
              </Button>
              <p className="w-full text-xs text-muted-foreground">
                Two-admin rule: the proposer cannot approve their own investment — a different admin
                must do it.
              </p>
            </div>
          )}

          {inv.status === "active" && (
            <div className="flex flex-wrap gap-3 items-center">
              <Button className="gap-2" onClick={() => setCloseOpen(true)}>
                <Banknote className="size-4" />
                Close Investment
              </Button>
              <p className="text-xs text-muted-foreground">
                Record the actual amount returned — profit or loss.
              </p>
            </div>
          )}

          {(inv.status === "closed" || inv.status === "rejected") && (
            <p className="text-sm text-muted-foreground">
              This investment is {inv.status} — no further actions available.
            </p>
          )}

          {/* Lifecycle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-border text-xs text-muted-foreground">
            <LifecycleRow
              label="Proposed by"
              name={adminName(inv.proposedBy)}
              date={inv.createdAt}
              mounted={mounted}
            />
            <LifecycleRow
              label="Approved by"
              name={adminName(inv.approvedBy)}
              date={inv.approvedAt}
              mounted={mounted}
            />
            <LifecycleRow
              label="Rejected by"
              name={adminName(inv.rejectedBy)}
              date={inv.rejectedAt}
              mounted={mounted}
            />
            <LifecycleRow
              label="Closed by"
              name={adminName(inv.closedBy)}
              date={inv.closedAt}
              mounted={mounted}
            />
          </div>

          {inv.rejectedReason && (
            <div className="text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3 border border-red-200 dark:border-red-800">
              <span className="font-medium text-red-700 dark:text-red-400">Reason: </span>
              <span className="text-red-700 dark:text-red-300">{inv.rejectedReason}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Investment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Principal</p>
              <p className="text-lg font-semibold mt-1">৳{inv.principal.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Expected Return Date
              </p>
              <p className="text-lg font-semibold mt-1">
                {mounted
                  ? new Date(inv.expectedReturnDate).toLocaleDateString("en-BD", {
                      dateStyle: "medium",
                    })
                  : "…"}
              </p>
            </div>
            {inv.status === "closed" && inv.returnedAmount !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Amount Returned
                </p>
                <p className="text-lg font-semibold mt-1">৳{inv.returnedAmount.toLocaleString()}</p>
              </div>
            )}
          </div>

          {inv.description && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Description
              </p>
              <p className="text-sm whitespace-pre-wrap">{inv.description}</p>
            </div>
          )}

          {/* Outcome */}
          {profit !== null && (
            <div
              className={`rounded-lg border px-4 py-3 ${
                profit > 0
                  ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20"
                  : profit === 0
                    ? "border-border bg-muted/50"
                    : "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  profit > 0
                    ? "text-green-800 dark:text-green-300"
                    : profit < 0
                      ? "text-red-700 dark:text-red-300"
                      : ""
                }`}
              >
                {profit > 0
                  ? `Profit: ৳${profit.toLocaleString()}`
                  : profit === 0
                    ? "Broke even"
                    : `Loss: ৳${Math.abs(profit).toLocaleString()}`}
              </p>
            </div>
          )}

          {/* Allocations */}
          {inv.status === "closed" && profit !== null && profit > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Profit Allocations
              </p>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border bg-card">
                    {inv.profitAllocations.map((a) => (
                      <tr key={a.purpose}>
                        <td className="px-4 py-2.5">{a.purpose}</td>
                        <td className="px-4 py-2.5 text-right font-medium">
                          ৳{a.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">
                        Retained in foundation fund
                        <Badge variant="outline" className="ml-2 text-xs">
                          remainder
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-green-700 dark:text-green-400">
                        ৳{(profit - allocatedTotal).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <RejectInvestmentDialog
        investmentId={inv._id}
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
      />
      <CloseInvestmentDialog
        investmentId={inv._id}
        principal={inv.principal}
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
      />
    </div>
  );
}
