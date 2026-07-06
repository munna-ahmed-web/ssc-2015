import type { NextRequest } from "next/server";

import { connectDB } from "@/lib/db";
import { GalleryImage } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 15 * 1024 * 1024;

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const images = await GalleryImage.find({}).sort({ order: 1, createdAt: -1 }).lean();
    return apiSuccess(images);
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/gallery-images]");
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const altText = (formData.get("altText") as string | null)?.trim();
    const caption = (formData.get("caption") as string | null)?.trim() || undefined;
    const orderRaw = formData.get("order") as string | null;

    if (!file) {
      return apiError("BAD_REQUEST", "No file uploaded.", 400);
    }
    if (!altText) {
      return apiError("BAD_REQUEST", "Alt text is required.", 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError(
        "UNSUPPORTED_MEDIA_TYPE",
        "Only JPEG, PNG, WebP, and GIF images are accepted.",
        415,
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      return apiError("PAYLOAD_TOO_LARGE", "Image must be smaller than 15 MB.", 413);
    }

    let order: number;
    if (orderRaw !== null && !isNaN(parseInt(orderRaw))) {
      order = parseInt(orderRaw);
    } else {
      const last = await GalleryImage.findOne({}).sort({ order: -1 }).select("order").lean();
      order = (last?.order ?? -1) + 1;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { url, publicId } = await uploadToCloudinary(buffer, {
      folder: "foundation/gallery",
      transformation: [
        { width: 1200, height: 1200, crop: "limit", quality: "auto:best", fetch_format: "auto" },
      ],
    });

    const galleryImage = await GalleryImage.create({
      url,
      publicId,
      altText,
      caption,
      order,
      isActive: true,
      uploadedBy: admin.sub,
    });

    return apiSuccess(galleryImage, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[POST /api/admin/gallery-images]");
  }
}
