"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";

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

import { useUpdateApplicationAction } from "./hook/applicationHooks";

interface RejectModalProps {
  applicationId: string;
  open: boolean;
  onClose: () => void;
}

export default function RejectModal({ applicationId, open, onClose }: RejectModalProps) {
  const router = useRouter();
  const { mutateAsync: updateApplication, isPending: submitting } = useUpdateApplicationAction();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (reason.trim().length < 5) {
      setError("Please provide a reason (at least 5 characters).");
      return;
    }
    setError(null);
    try {
      await updateApplication({
        id: applicationId,
        data: { action: "reject", rejectionReason: reason.trim() },
      });
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
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
            <AlertTriangle className="size-5" />
            Reject Application
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Please provide a reason for rejection. The reason will be stored with the application
            record.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="rejection-reason">Reason *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="e.g. Incomplete information provided, NID could not be verified…"
              rows={4}
              className={`resize-none ${error ? "border-destructive" : ""}`}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
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
            onClick={handleSubmit}
            disabled={submitting || reason.trim().length < 5}
            className="gap-2"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Rejecting…" : "Confirm Rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
