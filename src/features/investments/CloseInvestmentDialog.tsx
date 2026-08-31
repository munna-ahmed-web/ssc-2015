/* eslint-disable no-nested-ternary */
"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";

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

import { useCloseInvestment } from "./hook/investmentHooks";

interface AllocationRow {
  purpose: string;
  amount: string;
}

interface CloseInvestmentDialogProps {
  investmentId: string;
  principal: number;
  open: boolean;
  onClose: () => void;
}

export default function CloseInvestmentDialog({
  investmentId,
  principal,
  open,
  onClose,
}: CloseInvestmentDialogProps) {
  const { mutateAsync: closeInvestment, isPending } = useCloseInvestment();

  const [returnedAmount, setReturnedAmount] = useState("");
  const [returnedAt, setReturnedAt] = useState(new Date().toISOString().split("T")[0]);
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [confirmedLoss, setConfirmedLoss] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returned = Number(returnedAmount);
  const hasAmount = returnedAmount !== "" && !isNaN(returned) && returned >= 0;
  const profit = hasAmount ? returned - principal : 0;
  const isLoss = hasAmount && profit < 0;
  const allocatedTotal = allocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const stayingInFund = profit > 0 ? profit - allocatedTotal : 0;
  const overAllocated = profit > 0 && allocatedTotal > profit;

  const updateAllocation = (idx: number, field: keyof AllocationRow, value: string) => {
    setAllocations((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await closeInvestment({
        id: investmentId,
        returnedAmount: returned,
        returnedAt: returnedAt || undefined,
        allocations:
          profit > 0
            ? allocations
                .filter((a) => a.purpose.trim() && Number(a.amount) > 0)
                .map((a) => ({ purpose: a.purpose.trim(), amount: Number(a.amount) }))
            : [],
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const submitDisabled = isPending || !hasAmount || overAllocated || (isLoss && !confirmedLoss);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Close Investment</DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form onSubmit={handleSubmit} className="space-y-4 py-2" noValidate>
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-muted/50 border border-border px-4 py-2.5 text-sm">
            Principal invested: <span className="font-semibold">৳{principal.toLocaleString()}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="close-returned">Amount Returned (৳) *</Label>
              <Input
                id="close-returned"
                type="number"
                min={0}
                step={1}
                value={returnedAmount}
                onChange={(e) => {
                  setReturnedAmount(e.target.value);
                  setConfirmedLoss(false);
                }}
                placeholder="Actual money received back"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="close-date">Return Date</Label>
              <Input
                id="close-date"
                type="date"
                value={returnedAt}
                onChange={(e) => setReturnedAt(e.target.value)}
              />
            </div>
          </div>

          {/* Outcome preview */}
          {hasAmount && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                profit > 0
                  ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20"
                  : profit === 0
                    ? "border-border bg-muted/50"
                    : "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20"
              }`}
            >
              {profit > 0 ? (
                <>
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    Profit: ৳{profit.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Allocated out: ৳{allocatedTotal.toLocaleString()} · Stays in fund: ৳
                    {Math.max(0, stayingInFund).toLocaleString()}
                  </p>
                </>
              ) : profit === 0 ? (
                <p className="font-medium">Broke even — no profit, no loss.</p>
              ) : (
                <p className="font-semibold text-red-700 dark:text-red-300">
                  Loss: ৳{Math.abs(profit).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Profit allocations */}
          {profit > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Profit Allocations (optional)</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1 h-7 text-xs"
                  onClick={() => setAllocations((rows) => [...rows, { purpose: "", amount: "" }])}
                >
                  <Plus className="size-3" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Split profit into purposes (e.g. Social work, Club room expense). Anything not
                allocated stays in the foundation fund.
              </p>
              {allocations.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    value={row.purpose}
                    onChange={(e) => updateAllocation(idx, "purpose", e.target.value)}
                    placeholder="Purpose (e.g. Social work)"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={row.amount}
                    onChange={(e) => updateAllocation(idx, "amount", e.target.value)}
                    placeholder="৳"
                    className="w-28"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setAllocations((rows) => rows.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              {overAllocated && (
                <p className="text-xs text-destructive">
                  Allocations (৳{allocatedTotal.toLocaleString()}) exceed the profit (৳
                  {profit.toLocaleString()}).
                </p>
              )}
            </div>
          )}

          {/* Loss confirmation */}
          {isLoss && (
            <label className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedLoss}
                onChange={(e) => setConfirmedLoss(e.target.checked)}
                className="mt-0.5 rounded border-input text-primary focus:ring-ring"
              />
              <span className="text-sm text-red-800 dark:text-red-300">
                <AlertTriangle className="size-3.5 inline mr-1" />I confirm this investment returned
                ৳{returned.toLocaleString()} against a principal of ৳{principal.toLocaleString()} —
                a loss of ৳{Math.abs(profit).toLocaleString()}. This will be recorded permanently.
              </span>
            </label>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitDisabled} className="gap-2">
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Close Investment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
