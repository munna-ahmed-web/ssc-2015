"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Banknote,
  BarChart3,
  ImagePlay,
  Images,
  Settings,
  Heart,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Applications",
    href: "/dashboard/applications",
    icon: ClipboardList,
  },
  {
    label: "Members",
    href: "/dashboard/members",
    icon: Users,
  },
  {
    label: "Contributions",
    href: "/dashboard/contributions",
    icon: Banknote,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    label: "Hero Images",
    href: "/dashboard/hero-images",
    icon: ImagePlay,
  },
  {
    label: "Gallery Images",
    href: "/dashboard/gallery-images",
    icon: Images,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <Link
        href="/"
        className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border hover:bg-sidebar-accent/40 transition-colors cursor-pointer group"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary group-hover:scale-105 transition-transform">
          <Heart className="size-4 text-primary-foreground" />
        </span>
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground leading-none">SSC-2015</p>
          <p className="text-xs text-sidebar-foreground/50 mt-0.5">Foundation Admin</p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, "exact" in item ? item.exact : undefined);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active
                    ? "text-primary"
                    : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70",
                )}
              />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="size-3 text-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-xs text-sidebar-foreground/40 text-center">Foundation Management v1</p>
      </div>
    </aside>
  );
}
