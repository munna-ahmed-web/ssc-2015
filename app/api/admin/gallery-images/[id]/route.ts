import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { GalleryImage } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

const UpdateSchema = z.object({
  altText: z.string().min(1).max(200).trim().optional(),
  caption: z.string().max(300).trim().nullable().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("BAD_REQUEST", "Invalid image ID.", 400);
    }

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Validation failed.",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const image = await GalleryImage.findById(id);
    if (!image) {
      return apiError("NOT_FOUND", "Image not found.", 404);
    }

    const data = parsed.data;
    if (data.altText !== undefined) image.altText = data.altText;
    if (data.caption !== undefined) image.caption = data.caption ?? undefined;
    if (data.order !== undefined) image.order = data.order;
    if (data.isActive !== undefined) image.isActive = data.isActive;

    await image.save();

    return apiSuccess(image);
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[PATCH /api/admin/gallery-images/:id]");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("BAD_REQUEST", "Invalid image ID.", 400);
    }

    const image = await GalleryImage.findById(id);
    if (!image) {
      return apiError("NOT_FOUND", "Image not found.", 404);
    }

    if ((image as unknown as { publicId?: string }).publicId) {
      await deleteFromCloudinary((image as unknown as { publicId: string }).publicId);
    }

    await image.deleteOne();

    return apiSuccess({ id }, { message: "Image deleted successfully." });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[DELETE /api/admin/gallery-images/:id]");
  }
}
