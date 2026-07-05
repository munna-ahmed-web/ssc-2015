/**
 * HeroImage model — CMS for the public homepage hero section (Phase 9).
 *
 * Admins can upload, reorder, activate/deactivate, and delete hero images
 * without a code deployment. The public site fetches only `isActive: true`
 * images sorted by `order` ascending.
 */

import type { Document, Model } from "mongoose";
import mongoose, { Schema } from "mongoose";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IHeroImage extends Document {
  url: string; // Full URL of the image (Cloudinary)
  publicId?: string; // Cloudinary public_id — needed for deletion
  altText: string; // Accessibility alt text
  caption?: string; // Optional overlay caption
  order: number; // Display order (lower = shown first); admin can reorder
  isActive: boolean; // Inactive images are stored but not shown on the public site

  uploadedBy: mongoose.Types.ObjectId; // Reference to User

  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const heroImageSchema = new Schema<IHeroImage>(
  {
    url: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
    },
    altText: {
      type: String,
      required: [true, "Alt text is required for accessibility"],
      trim: true,
      maxlength: [200, "Alt text must be at most 200 characters"],
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [300, "Caption must be at most 300 characters"],
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "hero_images",
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Public site query: fetch active images in order
heroImageSchema.index({ isActive: 1, order: 1 });

// ─── Model (singleton — safe for Next.js hot-reload) ─────────────────────────

const HeroImage: Model<IHeroImage> =
  (mongoose.models.HeroImage as Model<IHeroImage>) ??
  mongoose.model<IHeroImage>("HeroImage", heroImageSchema);

export default HeroImage;
