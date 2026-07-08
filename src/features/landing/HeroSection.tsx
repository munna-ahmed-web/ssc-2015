"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFetchPublicHeroImages } from "@/features/hero-images/hook/heroImageHooks";

export default function HeroSection() {
  const { data: heroImages = [], isLoading } = useFetchPublicHeroImages();
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <section className="relative flex min-h-svh sm:min-h-[92vh] items-center overflow-hidden">
      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        {!isLoading && heroImages.length > 0 ? (
          heroImages.map((image, idx) => (
            <div
              key={image._id.toString()}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentIdx ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <Image
                src={image.url}
                alt={image.altText || "Foundation hero"}
                fill
                className="object-cover object-center opacity-85"
                priority={idx === 0}
              />
            </div>
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-primary/5" />
        )}
        {/* Gradient overlay for readability and clear image presentation */}
        <div className="absolute inset-0 bg-gradient-to-b sm:bg-gradient-to-r from-background/85 sm:from-background/65 via-background/60 sm:via-background/40 to-background/30 sm:to-background/15" />
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl px-0 sm:px-0 lg:px-35 py-20 sm:py-32 pt-24 sm:pt-32 lg:pt-40">
        <div className="max-w-3xl">
          <Badge
            variant="outline"
            className="mb-4 sm:mb-6 bg-primary/10 text-primary border-primary/20 font-semibold text-xs sm:text-sm tracking-wide sm:tracking-widest uppercase"
          >
            SSC 2015 Batch · Kaya Islamia Secondary School
          </Badge>

          <h1 className="mb-4 sm:mb-6 text-foreground font-bold tracking-tight text-3xl sm:text-4xl lg:text-5xl">
            United in Purpose,
            <br />
            <span className="text-primary">Stronger Together</span>
          </h1>

          <p className="mb-6 sm:mb-10 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
            Our foundation brings together alumni committed to uplifting our community through
            collective weekly and monthly contributions — transparent, accountable, and impactful.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="gap-2 shadow-lg shadow-primary/10">
              <Link href="/become-a-member">
                Become a Member <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-input text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
