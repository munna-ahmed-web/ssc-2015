"use client";

import { CheckCircle2, HandHeart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AboutSection() {
  const listItems = [
    "Fully transparent contribution ledger",
    "Admin-reviewed membership process",
    "Regular community reports & updates",
    "Support for members in need",
  ];

  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 md:grid-cols-2 items-center">
          <div>
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              Our Mission
            </Badge>
            <h2 className="mb-6 font-bold tracking-tight text-3xl">Building a Community of Care</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Born from the bonds forged in the classrooms of Kaya Islamia Secondary School, our
              SSC-2015 batch foundation channels collective goodwill into tangible community
              impact.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Every contribution — big or small — is carefully tracked, fully transparent, and
              directed where it matters most. Members contribute weekly or monthly, building a
              sustainable fund that empowers our community.
            </p>

            <ul className="space-y-3">
              {listItems.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual card stack */}
          <div className="relative hidden md:flex justify-center">
            <div className="relative w-80 h-80">
              {/* Background card */}
              <div className="absolute -right-4 -bottom-4 w-72 h-72 rounded-3xl bg-primary/10 border border-primary/20" />
              {/* Main card */}
              <div className="relative w-72 h-72 rounded-3xl bg-card border border-border shadow-xl flex flex-col items-center justify-center gap-6 p-8">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                  <HandHeart className="size-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold font-heading text-foreground">৳0</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Collected (Growing)</p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-primary text-primary" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
