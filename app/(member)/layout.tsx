import Link from "next/link";
import { Heart } from "lucide-react";

export const metadata = { title: "Member Portal — SSC-2015 Foundation" };

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary group-hover:scale-105 transition-transform">
              <Heart className="size-4 text-primary-foreground" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">SSC-2015 Foundation</p>
              <p className="text-xs text-muted-foreground mt-0.5">Member Portal</p>
            </div>
          </Link>
          <span className="text-xs text-muted-foreground rounded-full border border-border px-3 py-1">
            Read-only
          </span>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-8">{children}</main>
      <footer className="border-t border-border py-4">
        <p className="text-xs text-muted-foreground text-center">
          SSC-2015 Foundation — transparency for every member
        </p>
      </footer>
    </div>
  );
}
