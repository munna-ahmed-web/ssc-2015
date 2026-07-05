"use client";

import { useEffect } from "react";
import { AlertCircle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Application Crash]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-5">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-2 shadow-lg shadow-destructive/5">
        <AlertCircle className="size-9" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
          Application Error
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          A critical error occurred while loading this page. Our technical logs have captured the failure.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => reset()} className="gap-2" size="lg">
          <RotateCcw className="size-4" />
          Try Again
        </Button>
        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link href="/">
            <Home className="size-4" />
            Go to Homepage
          </Link>
        </Button>
      </div>
    </div>
  );
}
