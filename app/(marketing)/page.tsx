import {
  HeroSection,
  StatsSection,
  AboutSection,
  GallerySection,
  HowItWorksSection,
  ValuesSection,
  PrinciplesSection,
  CtaSection,
} from "@/features/landing";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <StatsSection />
      <AboutSection />
      <GallerySection />
      <HowItWorksSection />
      <ValuesSection />
      <PrinciplesSection />
      <CtaSection />
    </div>
  );
}

