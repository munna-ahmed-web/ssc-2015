"use client";

import { ClipboardList, UserCheck, Banknote } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      icon: ClipboardList,
      title: "Submit Your Application",
      desc: "Fill out the membership form with your personal information and preferred contribution amount.",
    },
    {
      step: "02",
      icon: UserCheck,
      title: "Admin Review",
      desc: "Our administrators review your application and approve you as an active member of the foundation.",
    },
    {
      step: "03",
      icon: Banknote,
      title: "Start Contributing",
      desc: "Make your weekly or monthly cash contributions and see them recorded in our transparent ledger.",
    },
  ];

  return (
    <section className="py-24 bg-muted/20 border-y border-border/50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            Simple Process
          </Badge>
          <h2 className="font-bold tracking-tight text-3xl">How It Works</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Joining and participating in the foundation is straightforward and transparent.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <div
              key={item.step}
              className="relative bg-card rounded-2xl p-8 border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
            >
              <span className="absolute top-6 right-6 text-5xl font-bold font-heading text-border/40 group-hover:text-primary/20 transition-colors">
                {item.step}
              </span>
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 mb-5">
                <item.icon className="size-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
