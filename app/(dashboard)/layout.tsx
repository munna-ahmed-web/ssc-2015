/* eslint-disable prefer-const */
import { redirect } from "next/navigation";

import AdminShell from "@/components/layout/AdminShell";
import { getDashboardStats } from "@/lib/dashboard";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models";

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  // Verify session server-side (middleware already guards, but belt-and-suspenders)
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  // Fetch admin name and pending count in parallel
  let adminName: string | undefined;
  let pendingCount = 0;

  await connectDB();
  const [user, stats] = await Promise.all([
    User.findById(session.sub).select("name").lean(),
    getDashboardStats().catch(() => null),
  ]);

  adminName = user?.name;
  pendingCount = stats?.pendingApplications ?? 0;

  return (
    <AdminShell pageTitle="Dashboard" pendingCount={pendingCount} adminName={adminName}>
      {children}
    </AdminShell>
  );
}
