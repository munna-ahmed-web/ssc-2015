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
import { formatPeriodLabel } from "@/lib/periods";
import { getErrorMessage } from "@/lib/api/errors";

import { useAddClubExpense } from "./hook/clubHooks";

const COMMON_TITLES = ["Room rent", "Electricity bill", "Water bill", "Internet", "Cleaning"];

interface AddClubExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  periodLabel: string;
}

export default function AddClubExpenseDialog({
  open,
  onClose,
  periodLabel,
}: AddClubExpenseDialogProps) {
  const { mutateAsync: addExpense, isPending } = useAddClubExpense();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [spentAt, setSpentAt] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setTitle("");
    setAmount("");
    setNotes("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await addExpense({
        title: title.trim(),
        amount: Number(amount),
        periodLabel,
        spentAt: spentAt || undefined,
        notes: notes.trim() || undefined,
      });
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong. Please try again."));
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
          <DialogTitle>Add Expense — {formatPeriodLabel(periodLabel)}</DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form onSubmit={handleSubmit} className="space-y-4 py-2" noValidate>
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="club-expense-title">What is the cost for? *</Label>
            <Input
              id="club-expense-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Room rent"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_TITLES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTitle(t)}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="club-expense-amount">Amount (৳) *</Label>
              <Input
                id="club-expense-amount"
                type="number"
                min={1}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 3000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="club-expense-date">Date</Label>
              <Input
                id="club-expense-date"
                type="date"
                value={spentAt}
                onChange={(e) => setSpentAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="club-expense-notes">Notes (optional)</Label>
            <Textarea
              id="club-expense-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !title.trim() || !amount}
              className="gap-2"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Add Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
