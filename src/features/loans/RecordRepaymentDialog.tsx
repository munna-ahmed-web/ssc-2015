"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useRecordRepayment } from "./hook/loanHooks";

interface RecordRepaymentDialogProps {
  loanId: string;
  principal: number;
  outstanding: number;
  open: boolean;
  onClose: () => void;
}

export default function RecordRepaymentDialog({
  loanId,
  principal,
  outstanding,
  open,
  onClose,
}: RecordRepaymentDialogProps) {
  const { mutateAsync: record, isPending } = useRecordRepayment();

  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const value = Number(amount);
  const valid = amount !== "" && !isNaN(value) && value > 0 && value <= outstanding;
  const tooMuch = amount !== "" && !isNaN(value) && value > outstanding;
  const remainingAfter = valid ? outstanding - value : outstanding;

  const handleClose = () => {
    setAmount("");
    setNotes("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await record({
        id: loanId,
        amount: value,
        paidAt: paidAt || undefined,
        notes: notes.trim() || undefined,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Repayment</DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form onSubmit={handleSubmit} className="space-y-4 py-2" noValidate>
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-muted/50 border border-border px-4 py-2.5 text-sm space-y-0.5">
            <p>
              Loan amount: <span className="font-semibold">৳{principal.toLocaleString()}</span>
            </p>
            <p>
              Still owed: <span className="font-semibold">৳{outstanding.toLocaleString()}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Interest-free — the borrower repays exactly what was lent, never more.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="repay-amount">Amount Received (৳) *</Label>
              <Input
                id="repay-amount"
                type="number"
                min={1}
                max={outstanding}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Up to ${outstanding}`}
              />
              {tooMuch && (
                <p className="text-xs text-destructive">
                  Only ৳{outstanding.toLocaleString()} is still owed.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="repay-date">Date Received</Label>
              <Input
                id="repay-date"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="repay-notes">Notes (optional)</Label>
            <Textarea
              id="repay-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. paid in cash at the monthly meeting"
              className="resize-none"
            />
          </div>

          {valid && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                remainingAfter === 0
                  ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20"
                  : "border-border bg-muted/50"
              }`}
            >
              {remainingAfter === 0 ? (
                <p className="font-semibold text-green-800 dark:text-green-300">
                  This settles the loan — it will be marked fully recovered.
                </p>
              ) : (
                <p>After this payment: ৳{remainingAfter.toLocaleString()} still outstanding.</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !valid} className="gap-2">
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Record Repayment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
