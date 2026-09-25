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

import { useAddClubCollection, useFetchClubContributors } from "./hook/clubHooks";

interface AddClubCollectionDialogProps {
  open: boolean;
  onClose: () => void;
  periodLabel: string;
}

export default function AddClubCollectionDialog({
  open,
  onClose,
  periodLabel,
}: AddClubCollectionDialogProps) {
  const { data: contributors = [] } = useFetchClubContributors();
  const { mutateAsync: addCollection, isPending } = useAddClubCollection();

  const [contributorId, setContributorId] = useState("");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setContributorId("");
    setAmount("");
    setNotes("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await addCollection({
        contributorId,
        amount: Number(amount),
        periodLabel,
        paidAt: paidAt || undefined,
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
          <DialogTitle>Record Collection — {formatPeriodLabel(periodLabel)}</DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form onSubmit={handleSubmit} className="space-y-4 py-2" noValidate>
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="club-person">Who paid? *</Label>
            <select
              id="club-person"
              value={contributorId}
              onChange={(e) => setContributorId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-ring"
            >
              <option value="">Select a person…</option>
              {contributors.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {contributors.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No people added yet — add someone in the People tab first.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="club-amount">Amount (৳) *</Label>
              <Input
                id="club-amount"
                type="number"
                min={1}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="club-paid-at">Date</Label>
              <Input
                id="club-paid-at"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="club-notes">Notes (optional)</Label>
            <Textarea
              id="club-notes"
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
              disabled={isPending || !contributorId || !amount}
              className="gap-2"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Record Collection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
