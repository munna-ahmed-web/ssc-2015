import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { HeroImage } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";

const UpdateSchema = z.object({
  altText: z.string().min(1).max(200).trim().optional(),
  caption: z.string().max(300).trim().nullable().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ─── PATCH /api/admin/hero-images/[id] ────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const image = await HeroImage.findById(id);
    if (!image) {
      return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
    }

    const data = parsed.data;
    if (data.altText !== undefined) image.altText = data.altText;
    if (data.caption !== undefined) image.caption = data.caption ?? undefined;
    if (data.order !== undefined) image.order = data.order;
    if (data.isActive !== undefined) image.isActive = data.isActive;

    await image.save();

    return NextResponse.json({ success: true, data: image });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[PATCH /api/admin/hero-images/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/hero-images/[id] ───────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const image = await HeroImage.findById(id);
    if (!image) {
      return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
    }

    // Remove from Cloudinary if publicId exists
    if ((image as unknown as { publicId?: string }).publicId) {
      await deleteFromCloudinary((image as unknown as { publicId: string }).publicId);
    }

    await image.deleteOne();

    return NextResponse.json({ success: true, message: "Image deleted successfully." });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[DELETE /api/admin/hero-images/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
