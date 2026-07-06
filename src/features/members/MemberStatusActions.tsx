"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, PlayCircle, StopCircle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/response";
import { Button } from "@/components/ui/button";
import type { MemberStatus } from "@/models";

interface MemberStatusActionsProps {
  memberId: string;
  currentStatus: MemberStatus;
}

export default function MemberStatusActions({ memberId, currentStatus }: MemberStatusActionsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: MemberStatus) => {
    // Confirm terminal status change
    if (newStatus === "exited") {
      const confirmExit = confirm(
        "Are you sure you want to mark this member as exited? This is a terminal state and indicates they have formally left the foundation.",
      );
      if (!confirmExit) return;
    }

    setError(null);
    setUpdating(true);

    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(getApiErrorMessage(data, "Failed to update member status."));
        return;
      }

      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3 border border-destructive/30">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2.5">
        {/* Reactivate (shown for suspended or exited) */}
        {currentStatus !== "active" && (
          <Button
            size="sm"
            onClick={() => handleStatusChange("active")}
            disabled={updating}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            {updating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PlayCircle className="size-4" />
            )}
            Reactivate Member
          </Button>
        )}

        {/* Suspend (shown for active) */}
        {currentStatus === "active" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange("suspended")}
            disabled={updating}
            className="gap-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
          >
            {updating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <StopCircle className="size-4" />
            )}
            Suspend Member
          </Button>
        )}

        {/* Exit (shown for active or suspended) */}
        {currentStatus !== "exited" && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleStatusChange("exited")}
            disabled={updating}
            className="gap-2"
          >
            {updating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <AlertTriangle className="size-4" />
            )}
            Mark as Exited
          </Button>
        )}
      </div>
    </div>
  );
}
