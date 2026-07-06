import { connectDB } from "@/lib/db";
import { GalleryImage } from "@/models";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

export async function GET() {
  try {
    await connectDB();

    const images = await GalleryImage.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return apiSuccess(images);
  } catch (err) {
    return handleRouteError(err, "[GET /api/gallery-images]");
  }
}
