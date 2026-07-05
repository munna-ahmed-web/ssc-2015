import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Loader2 className="size-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground animate-pulse">Loading dashboard content…</p>
    </div>
  );
}
