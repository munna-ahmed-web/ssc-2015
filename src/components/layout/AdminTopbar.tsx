"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Bell, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { clearClientTokens } from "@/lib/auth/client-tokens";

interface AdminTopbarProps {
  onMenuToggle?: () => void;
  pageTitle: string;
  pendingCount?: number;
  adminName?: string;
}

export default function AdminTopbar({
  onMenuToggle,
  pageTitle,
  pendingCount,
  adminName,
}: AdminTopbarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      clearClientTokens();
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-6">
      {/* Mobile menu toggle */}
      <button
        aria-label="Toggle sidebar"
        className="lg:hidden text-muted-foreground hover:text-foreground"
        onClick={onMenuToggle}
      >
        <Menu className="size-5" />
      </button>

      {/* Page title */}
      <h4 className="font-semibold text-foreground">{pageTitle}</h4>

      <div className="ml-auto flex items-center gap-3">
        {/* Pending badge */}
        {typeof pendingCount === "number" && pendingCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bell className="size-4 text-primary" />
            <Badge variant="secondary" className="text-xs">
              {pendingCount}
            </Badge>
          </div>
        )}

        <Separator orientation="vertical" className="h-6" />

        {/* Admin info */}
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium text-foreground leading-none">{adminName ?? "Admin"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Foundation Manager</p>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon-sm"
          title="Sign out"
          className="text-muted-foreground hover:text-destructive"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Sign out"
        >
          {loggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
        </Button>
      </div>
    </header>
  );
}
