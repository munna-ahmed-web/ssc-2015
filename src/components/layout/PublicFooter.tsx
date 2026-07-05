import Link from "next/link";
import { Heart, Mail, MapPin, Phone } from "lucide-react";

import { Separator } from "@/components/ui/separator";

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background mt-24">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <Heart className="size-4 text-primary-foreground" />
              </span>
              <span className="font-heading text-lg font-bold text-background">
                অদম্য-15 Foundation
              </span>
            </div>
            <p className="text-sm text-background/70 leading-relaxed max-w-xs">
              A community-driven foundation by the SSC 2015 batch of Kaya Islamia Secondary School,
              united in giving back.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-widest text-background/50">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About Us" },
                { href: "/become-a-member", label: "Become a Member" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-widest text-background/50">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-start gap-2.5">
                <MapPin className="size-4 mt-0.5 shrink-0 text-primary" />
                Kaya-7010, Kumarkhali, Kushtia
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-primary" />
                +880 1745-412386
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-primary" />
                web.munnaahmed@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-10 bg-background/10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-background/50">
          <p>© {year} SSC-2015 Foundation. All rights reserved.</p>
          <p>Built with ❤️ for our community</p>
        </div>
      </div>
    </footer>
  );
}
