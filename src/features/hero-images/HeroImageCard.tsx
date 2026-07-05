"use client";

/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable no-alert */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Trash2, GripVertical, Loader2, Edit2, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import type { SerializedHeroImage } from "./types/types";
import { useUpdateHeroImage, useDeleteHeroImage } from "./hook/heroImageHooks";

interface HeroImageCardProps {
  image: SerializedHeroImage;
}

export default function HeroImageCard({ image }: HeroImageCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"toggle" | "delete" | "order" | null>(null);
  const [editingOrder, setEditingOrder] = useState(false);
  const [orderValue, setOrderValue] = useState(String(image.order));
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: updateHeroImage } = useUpdateHeroImage();
  const { mutateAsync: deleteHeroImage } = useDeleteHeroImage();

  const id = image._id.toString();

  // ── Toggle active state ────────────────────────────────────────────────────

  const handleToggle = async () => {
    setLoading("toggle");
    setError(null);
    try {
      await updateHeroImage({ id, data: { isActive: !image.isActive } });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(null);
    }
  };

  // ── Update order ───────────────────────────────────────────────────────────

  const handleOrderSave = async () => {
    const newOrder = parseInt(orderValue);
    if (isNaN(newOrder) || newOrder < 0) {
      setError("Order must be 0 or higher.");
      return;
    }
    if (newOrder === image.order) {
      setEditingOrder(false);
      return;
    }

    setLoading("order");
    setError(null);
    try {
      await updateHeroImage({ id, data: { order: newOrder } });
      setEditingOrder(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!confirm("Delete this image? It will be removed from Cloudinary and the database.")) return;
    setLoading("delete");
    setError(null);
    try {
      await deleteHeroImage(id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden bg-card transition-all ${image.isActive ? "border-border" : "border-border/50 opacity-60"}`}
    >
      {/* Image preview */}
      <div className="relative w-full h-44 bg-muted overflow-hidden">
        <Image
          src={image.url}
          alt={image.altText}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        {/* Active badge overlay */}
        <div className="absolute top-2 left-2">
          <Badge
            variant="outline"
            className={`text-xs ${
              image.isActive
                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {image.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-sm font-medium truncate" title={image.altText}>
            {image.altText}
          </p>
          {image.caption && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate" title={image.caption}>
              {image.caption}
            </p>
          )}
        </div>

        {/* Order editor */}
        <div className="flex items-center gap-2">
          <GripVertical className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Order:</span>
          {editingOrder ? (
            <>
              <Input
                type="number"
                min={0}
                value={orderValue}
                onChange={(e) => setOrderValue(e.target.value)}
                className="h-6 w-16 text-xs px-2"
              />
              <button
                onClick={handleOrderSave}
                disabled={loading === "order"}
                className="text-green-600 hover:text-green-700"
                title="Save order"
              >
                {loading === "order" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
              </button>
              <button
                onClick={() => {
                  setEditingOrder(false);
                  setOrderValue(String(image.order));
                }}
                className="text-muted-foreground hover:text-foreground"
                title="Cancel"
              >
                <X className="size-3.5" />
              </button>
            </>
          ) : (
            <>
              <span className="text-xs font-semibold">{image.order}</span>
              <button
                onClick={() => setEditingOrder(true)}
                className="text-muted-foreground hover:text-foreground ml-1"
                title="Edit order"
              >
                <Edit2 className="size-3" />
              </button>
            </>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-border">
          <Button
            size="xs"
            variant="outline"
            onClick={handleToggle}
            disabled={loading === "toggle"}
            className="flex-1 gap-1.5"
          >
            {loading === "toggle" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : image.isActive ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
            {image.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={handleDelete}
            disabled={loading === "delete"}
            className="text-muted-foreground hover:text-destructive gap-1.5"
            title="Delete image"
          >
            {loading === "delete" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
