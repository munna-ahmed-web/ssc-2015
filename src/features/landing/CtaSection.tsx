"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CtaSection() {
  return (
    <section className="py-24 bg-muted/40 border-t border-border">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <Badge
          variant="outline"
          className="mb-6 bg-primary/5 text-primary border-primary/20 text-xs tracking-widest uppercase"
        >
          Open Enrollment
        </Badge>
        <h2 className="text-foreground mb-6 font-bold tracking-tight text-3xl">
          Ready to Make a Difference?
        </h2>
        <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
          Join your SSC-2015 batchmates who are already contributing weekly and monthly to build
          something lasting for our community.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg" className="gap-2 shadow-lg shadow-primary/10">
            <Link href="/become-a-member">
              Apply for Membership <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-input text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Link href="/about">Read Our Story</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
