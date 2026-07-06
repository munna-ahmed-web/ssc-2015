"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Undo2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPeriodLabel } from "@/lib/periods";
import { getApiErrorMessage } from "@/lib/api/response";

interface ReversalModalProps {
  contributionId: string;
  memberName: string;
  periodLabel: string;
  amount: number;
  open: boolean;
  onClose: () => void;
}

export default function ReversalModal({
  contributionId,
  memberName,
  periodLabel,
  amount,
  open,
  onClose,
}: ReversalModalProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (notes.trim().length < 5) {
      setError("Please provide a reason (at least 5 characters).");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/contributions/${contributionId}/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(getApiErrorMessage(data, "Reversal failed."));
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Undo2 className="size-5" />
            Reverse Contribution
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary */}
          <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member</span>
              <span className="font-medium">{memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period</span>
              <span className="font-medium">{formatPeriodLabel(periodLabel)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">৳{amount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2.5 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />A reversal creates a new audit
            entry. The original record is never deleted.
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reversal-notes">Reason for Reversal *</Label>
            <Textarea
              id="reversal-notes"
              placeholder="e.g. Recorded against wrong member, cash returned…"
              rows={3}
              className={`resize-none ${error ? "border-destructive" : ""}`}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setError(null);
              }}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={handleSubmit}
            disabled={submitting || notes.trim().length < 5}
            className="gap-2"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Processing…" : "Confirm Reversal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
