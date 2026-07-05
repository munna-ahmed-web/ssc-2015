"use client";

/* eslint-disable @typescript-eslint/no-misused-promises */

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, ImagePlay } from "lucide-react";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useCreateHeroImage } from "./hook/heroImageHooks";

interface UploadImageModalProps {
  open: boolean;
  onClose: () => void;
}

const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";

export default function UploadImageModal({ open, onClose }: UploadImageModalProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [order, setOrder] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: createHeroImage, isPending: submitting } = useCreateHeroImage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setAltText("");
    setCaption("");
    setOrder("");
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select an image file.");
      return;
    }
    if (!altText.trim()) {
      setError("Alt text is required for accessibility.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Image must be smaller than 15 MB.");
      return;
    }

    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("altText", altText.trim());
      if (caption.trim()) form.append("caption", caption.trim());
      if (order.trim()) form.append("order", order.trim());

      await createHeroImage(form);

      handleClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            Upload Hero Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File picker */}
          <div
            className={`rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
              preview ? "border-primary/40" : "border-border hover:border-primary/40"
            }`}
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <Image
                src={preview}
                alt="Preview"
                className="w-full h-40 object-cover"
                width={100}
                height={100}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <ImagePlay className="size-10 opacity-30 mb-3" />
                <p className="text-sm">Click to select an image</p>
                <p className="text-xs opacity-60 mt-1">JPEG, PNG, WebP, GIF — max 15 MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={handleFileChange}
          />
          {file && (
            <p className="text-xs text-muted-foreground truncate">
              Selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </p>
          )}

          {/* Alt text */}
          <div className="space-y-1.5">
            <Label htmlFor="hero-altText">
              Alt Text * <span className="text-xs text-muted-foreground">(accessibility)</span>
            </Label>
            <Input
              id="hero-altText"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Foundation members at annual gathering 2024"
            />
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <Label htmlFor="hero-caption">
              Caption <span className="text-xs text-muted-foreground">(optional overlay)</span>
            </Label>
            <Textarea
              id="hero-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="resize-none"
              placeholder="Annual fundraising dinner — July 2024"
            />
          </div>

          {/* Order */}
          <div className="space-y-1.5">
            <Label htmlFor="hero-order">
              Display Order{" "}
              <span className="text-xs text-muted-foreground">(leave blank for last)</span>
            </Label>
            <Input
              id="hero-order"
              type="number"
              min={0}
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="0 = first"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3 border border-destructive/30">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !file} className="gap-2">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Uploading…" : "Upload Image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
