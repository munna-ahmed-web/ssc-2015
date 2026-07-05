"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

import { useFetchPublicGalleryImages } from "@/features/gallery-images/hook/galleryImageHooks";
import { Badge } from "@/components/ui/badge";

export default function GallerySection() {
  const { data: images = [], isLoading } = useFetchPublicGalleryImages();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <section className="py-20 bg-background border-t border-border">
        <div className="mx-auto max-w-7xl px-6 text-center space-y-4">
          <Loader2 className="size-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading gallery…</p>
        </div>
      </section>
    );
  }

  if (images.length === 0) {
    return null; // Don't show the section if there are no photos
  }

  const activeImage = lightboxIndex !== null ? images[lightboxIndex] : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === 0 ? images.length - 1 : lightboxIndex - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === images.length - 1 ? 0 : lightboxIndex + 1);
  };

  return (
    <section id="gallery" className="py-24 bg-muted/30 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4 bg-primary/5 text-primary border-primary/20">
            Our Gallery
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Moments & Activities
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A glimpse into our collective efforts, campaigns, and batch events.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image, idx) => (
            <div
              key={image._id}
              onClick={() => setLightboxIndex(idx)}
              className="group relative h-64 rounded-2xl overflow-hidden border border-border/60 bg-card cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
            >
              <Image
                src={image.url}
                alt={image.altText}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <div className="absolute top-4 right-4 size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <ZoomIn className="size-4" />
                </div>
                <p className="text-sm font-semibold text-foreground line-clamp-2">{image.altText}</p>
                {image.caption && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{image.caption}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && activeImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top controls */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
            <span className="text-xs text-white/60 font-medium">
              {lightboxIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => setLightboxIndex(null)}
              className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Close lightbox"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="relative w-full max-w-5xl h-[70vh] flex items-center justify-center">
            {/* Prev Button */}
            <button
              onClick={handlePrev}
              className="absolute left-2 md:left-4 z-40 size-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-6" />
            </button>

            {/* Image Wrapper */}
            <div
              className="relative w-full h-full"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
            >
              <Image
                src={activeImage.url}
                alt={activeImage.altText}
                fill
                priority
                className="object-contain"
                sizes="100vw"
              />
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="absolute right-2 md:right-4 z-40 size-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="size-6" />
            </button>
          </div>

          {/* Caption Overlay */}
          <div
            className="w-full max-w-3xl text-center mt-6 text-white space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">{activeImage.altText}</h3>
            {activeImage.caption && (
              <p className="text-sm text-white/70">{activeImage.caption}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
