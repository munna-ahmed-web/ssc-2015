"use client";

import { useState } from "react";

import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminTopbar from "@/components/layout/AdminTopbar";

interface AdminShellProps {
  children: React.ReactNode;
  pageTitle: string;
  pendingCount?: number;
  adminName?: string;
}

export default function AdminShell({
  children,
  pageTitle,
  pendingCount,
  adminName,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Desktop sidebar (always visible) ── */}
      <div className="hidden lg:flex lg:shrink-0">
        <AdminSidebar />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <AdminSidebar />
          </div>
        </>
      )}

      {/* ── Main content area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar
          pageTitle={pageTitle}
          pendingCount={pendingCount}
          adminName={adminName}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
