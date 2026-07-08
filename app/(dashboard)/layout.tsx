"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import AdminShell from "@/components/layout/AdminShell";
import { useFetchAdminProfile } from "@/features/settings/hook/settingsHooks";
import { useFetchDashboardStats } from "@/features/dashboard/hook/dashboardHooks";
import { getClientAccessToken } from "@/lib/auth/client-tokens";

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  // Check client token on mount (client-only)
  useEffect(() => {
    const token = getClientAccessToken();
    if (!token) {
      router.replace("/login");
    } else {
      setHasToken(true);
      setMounted(true);
    }
  }, [router]);

  const { data: admin, isLoading: isAdminLoading, isError: isAdminError } = useFetchAdminProfile();

  const { data: stats, isLoading: isStatsLoading } = useFetchDashboardStats();

  // Show loader during SSR and until client-side mount token verification is complete
  if (!mounted || !hasToken) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center space-y-3 bg-background">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Verifying administrator session…</p>
      </div>
    );
  }

  // Once mounted, show query loaders
  if (isAdminLoading || isStatsLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center space-y-3 bg-background">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading dashboard layout…</p>
      </div>
    );
  }

  if (isAdminError || !admin) {
    router.replace("/login");
    return null;
  }

  return (
    <AdminShell
      pageTitle="Dashboard"
      pendingCount={stats?.pendingApplications ?? 0}
      adminName={admin.name}
    >
      {children}
    </AdminShell>
  );
}
