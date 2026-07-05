"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Panel Crash]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-2">
        <AlertCircle className="size-8" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">Something went wrong in this panel</h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
          An unexpected error occurred while loading this section. You can try refreshing the section below.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => reset()} className="gap-2" size="sm">
          <RotateCcw className="size-4" />
          Try Again
        </Button>
        <Button
          onClick={() => { window.location.reload(); }}
          variant="outline"
          size="sm"
        >
          Reload Page
        </Button>
      </div>
    </div>
  );
}
