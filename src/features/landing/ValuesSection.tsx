"use client";

import { Users, TrendingUp, HandHeart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ValuesSection() {
  const values = [
    {
      icon: Users,
      title: "Brotherhood",
      desc: "A bond formed in school that continues to strengthen with every act of giving.",
    },
    {
      icon: TrendingUp,
      title: "Accountability",
      desc: "Every taka is logged, reviewed, and reported. Full transparency, always.",
    },
    {
      icon: HandHeart,
      title: "Community Impact",
      desc: "Our contributions flow directly into meaningful initiatives for our community.",
    },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            Our Values
          </Badge>
          <h2 className="font-bold tracking-tight text-3xl">What We Stand For</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((val) => (
            <div
              key={val.title}
              className="flex gap-5 p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <div className="shrink-0 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <val.icon className="size-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">{val.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{val.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
