import HeroImageGrid from "@/features/hero-images/HeroImageGrid";

export const metadata = { title: "Hero Images — SSC-2015 Foundation Admin" };

export default function HeroImagesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Hero Image Management</h2>
        <p className="text-muted-foreground mt-1">
          Upload, reorder, and toggle images shown on the public homepage
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 px-5 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Display order:</span> Images with a lower
        order number appear first. Only{" "}
        <span className="font-medium text-foreground">Active</span> images are shown on the public
        site. Inactive images are stored but hidden.
      </div>

      <HeroImageGrid />
    </div>
  );
}
