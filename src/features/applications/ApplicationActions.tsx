"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import RejectModal from "./RejectModal";
import type { ApplicationStatus } from "@/models";

interface ApplicationActionsProps {
  applicationId: string;
  status: ApplicationStatus;
}

export default function ApplicationActions({ applicationId, status }: ApplicationActionsProps) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read-only states
  if (status === "approved") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-3 border border-green-200 dark:border-green-800">
        <CheckCircle2 className="size-4 shrink-0" />
        This application has been approved. A member record has been created.
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3 border border-red-200 dark:border-red-800">
        <XCircle className="size-4 shrink-0" />
        This application has been rejected.
      </div>
    );
  }

  const handleApprove = async () => {
    setError(null);
    setApproving(true);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Approval failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3 border border-destructive/30">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleApprove}
          disabled={approving}
          className="gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          {approving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          {approving ? "Approving…" : "Approve Application"}
        </Button>
        <Button
          variant="destructive"
          onClick={() => setRejectOpen(true)}
          disabled={approving}
          className="gap-2"
        >
          <XCircle className="size-4" />
          Reject Application
        </Button>
      </div>

      <RejectModal
        applicationId={applicationId}
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
      />
    </div>
  );
}
