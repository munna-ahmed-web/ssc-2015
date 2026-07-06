import { connectDB } from "@/lib/db";
import { HeroImage } from "@/models";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

export async function GET() {
  try {
    await connectDB();

    const images = await HeroImage.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return apiSuccess(images);
  } catch (err) {
    return handleRouteError(err, "[GET /api/hero-images]");
  }
}
