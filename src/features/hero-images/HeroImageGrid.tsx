"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import HeroImageCard from "./HeroImageCard";
import UploadImageModal from "./UploadImageModal";
import { useFetchHeroImages } from "./hook/heroImageHooks";

export default function HeroImageGrid() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data: images = [], isLoading, isError, error } = useFetchHeroImages();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading images…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-5 py-6 text-center">
        <p className="text-sm font-medium text-destructive">Failed to load hero images</p>
        <p className="text-xs text-destructive/80 mt-1">{error.message || "An error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {images.length} image{images.length !== 1 ? "s" : ""}
            {" · "}
            {images.filter((i) => i.isActive).length} active
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Upload Image
        </Button>
      </div>

      {/* Grid */}
      {images.length === 0 ? (
        <div
          className="rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center text-muted-foreground cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => setUploadOpen(true)}
        >
          <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Plus className="size-7 opacity-40" />
          </div>
          <p className="font-medium">No images yet</p>
          <p className="text-xs opacity-60 mt-1">Click to upload your first hero image</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <HeroImageCard key={image._id.toString()} image={image} />
          ))}
        </div>
      )}

      <UploadImageModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
