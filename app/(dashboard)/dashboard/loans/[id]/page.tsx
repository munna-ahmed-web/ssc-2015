"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  HandCoins,
  Loader2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { adminName } from "@/lib/utils";
import LoanStatusBadge from "@/features/loans/LoanStatusBadge";
import LoanReasonDialog from "@/features/loans/LoanReasonDialog";
import RecordRepaymentDialog from "@/features/loans/RecordRepaymentDialog";
import {
  useApproveLoan,
  useFetchLoan,
  useRejectLoan,
  useWriteOffLoan,
} from "@/features/loans/hook/loanHooks";
import { isOverdue, outstandingOf, repaidTotal } from "@/features/loans/types/types";

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

export default function LoanDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data: loan, isLoading, isError, error } = useFetchLoan(id);
  const { mutateAsync: approve, isPending: approving } = useApproveLoan();
  const { mutateAsync: reject } = useRejectLoan();
  const { mutateAsync: writeOff } = useWriteOffLoan();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const [repayOpen, setRepayOpen] = useState(false);
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
        <p className="text-sm text-muted-foreground">Loading loan…</p>
      </div>
    );
  }

  if (isError || !loan) {
    return (
      <div className="max-w-md mx-auto mt-10 rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-6 text-center">
        <AlertCircle className="size-8 mx-auto text-destructive mb-2" />
        <p className="text-sm font-medium text-destructive">Failed to load loan</p>
        <p className="text-xs text-destructive/80 mt-1">
          {error instanceof Error ? error.message : "An error occurred."}
        </p>
      </div>
    );
  }

  const repaid = repaidTotal(loan);
  const outstanding = outstandingOf(loan);
  const overdue = isOverdue(loan);
  const repaidPct = loan.principal > 0 ? Math.round((repaid / loan.principal) * 100) : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/dashboard/loans">
            <ArrowLeft className="size-4" />
            Loans
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <h2 className="text-lg">{loan.borrowerName}</h2>
        <LoanStatusBadge status={loan.status} />
        {overdue && (
          <Badge variant="destructive" className="text-xs gap-1">
            <AlertTriangle className="size-3" />
            Overdue
          </Badge>
        )}
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

          {loan.status === "pending" && (
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2" onClick={() => void handleApprove()} disabled={approving}>
                {approving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Approve &amp; Disburse
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
                Two-admin rule: the proposer cannot approve their own loan — a different admin must
                do it.
              </p>
            </div>
          )}

          {loan.status === "active" && (
            <div className="flex flex-wrap gap-3 items-center">
              <Button className="gap-2" onClick={() => setRepayOpen(true)}>
                <HandCoins className="size-4" />
                Record Repayment
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setWriteOffOpen(true)}
              >
                <AlertTriangle className="size-4" />
                Write Off
              </Button>
              <p className="w-full text-xs text-muted-foreground">
                Write off only if the money genuinely cannot be recovered — it permanently reduces
                the fund.
              </p>
            </div>
          )}

          {(loan.status === "recovered" ||
            loan.status === "rejected" ||
            loan.status === "written_off") && (
            <p className="text-sm text-muted-foreground">
              This loan is {loan.status.replace("_", " ")} — no further actions available.
            </p>
          )}

          {/* Lifecycle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-border text-xs text-muted-foreground">
            <LifecycleRow
              label="Proposed by"
              name={adminName(loan.proposedBy)}
              date={loan.createdAt}
              mounted={mounted}
            />
            <LifecycleRow
              label="Approved by"
              name={adminName(loan.approvedBy)}
              date={loan.approvedAt}
              mounted={mounted}
            />
            <LifecycleRow
              label="Rejected by"
              name={adminName(loan.rejectedBy)}
              date={loan.rejectedAt}
              mounted={mounted}
            />
            <LifecycleRow
              label="Written off by"
              name={adminName(loan.writtenOffBy)}
              date={loan.writtenOffAt}
              mounted={mounted}
            />
            <LifecycleRow label="Fully recovered" date={loan.recoveredAt} mounted={mounted} />
          </div>

          {loan.rejectedReason && (
            <div className="text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3 border border-red-200 dark:border-red-800">
              <span className="font-medium text-red-700 dark:text-red-400">Rejected: </span>
              <span className="text-red-700 dark:text-red-300">{loan.rejectedReason}</span>
            </div>
          )}
          {loan.writeOffReason && (
            <div className="text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3 border border-red-200 dark:border-red-800">
              <span className="font-medium text-red-700 dark:text-red-400">Written off: </span>
              <span className="text-red-700 dark:text-red-300">{loan.writeOffReason}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Loan Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount Lent</p>
              <p className="text-lg font-semibold mt-1">৳{loan.principal.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Repaid</p>
              <p className="text-lg font-semibold mt-1 text-green-700 dark:text-green-400">
                ৳{repaid.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Still Owed</p>
              <p
                className={`text-lg font-semibold mt-1 ${outstanding > 0 ? "" : "text-muted-foreground"}`}
              >
                ৳{outstanding.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Repayment progress */}
          {(loan.status === "active" || loan.status === "recovered") && (
            <div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, repaidPct)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{repaidPct}% repaid</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Expected Return Date
              </p>
              <p className={`mt-1 font-medium ${overdue ? "text-destructive" : ""}`}>
                {mounted
                  ? new Date(loan.expectedReturnDate).toLocaleDateString("en-BD", {
                      dateStyle: "medium",
                    })
                  : "…"}
              </p>
            </div>
            {loan.borrowerPhone && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Borrower Phone
                </p>
                <p className="mt-1 font-medium">{loan.borrowerPhone}</p>
              </div>
            )}
          </div>

          {loan.purpose && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Purpose</p>
              <p className="text-sm whitespace-pre-wrap">{loan.purpose}</p>
            </div>
          )}

          <div className="rounded-lg bg-muted/50 border border-border px-4 py-2.5 text-xs text-muted-foreground">
            Interest-free loan — the borrower repays exactly ৳{loan.principal.toLocaleString()}, no
            more.
          </div>
        </CardContent>
      </Card>

      {/* Repayment history */}
      {loan.repayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Repayment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {["Date", "Amount", "Received By", "Notes"].map((h) => (
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
                    {loan.repayments.map((r, idx) => (
                      <tr
                        key={`${r.paidAt}-${idx}`}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {mounted ? new Date(r.paidAt).toLocaleDateString("en-BD") : "…"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-700 dark:text-green-400">
                          ৳{r.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {adminName(r.receivedBy) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {r.notes ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <LoanReasonDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject Loan Proposal"
        description="This proposal will be rejected and no money will be disbursed."
        confirmLabel="Reject Proposal"
        placeholder="Why is this loan being rejected?"
        onConfirm={(reason) => reject({ id, reason })}
      />
      <LoanReasonDialog
        open={writeOffOpen}
        onClose={() => setWriteOffOpen(false)}
        title="Write Off Loan"
        description={`৳${outstanding.toLocaleString()} will be recorded as permanently unrecoverable and removed from the fund balance. This cannot be undone.`}
        confirmLabel="Write Off Loan"
        placeholder="Why can this money not be recovered?"
        onConfirm={(reason) => writeOff({ id, reason })}
      />
      <RecordRepaymentDialog
        loanId={id}
        principal={loan.principal}
        outstanding={outstanding}
        open={repayOpen}
        onClose={() => setRepayOpen(false)}
      />
    </div>
  );
}
