import GalleryImageGrid from "@/features/gallery-images/GalleryImageGrid";

export const metadata = {
  title: "Gallery Images — Dashboard",
};

export default function GalleryImagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gallery Images</h1>
        <p className="text-sm text-muted-foreground">
          Manage the photos shown in the public homepage gallery section.
        </p>
      </div>
      <GalleryImageGrid />
    </div>
  );
}
