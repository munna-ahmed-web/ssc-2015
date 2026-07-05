import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { HeroImage } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

// ─── GET /api/admin/hero-images ───────────────────────────────────────────────

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const images = await HeroImage.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: images });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/admin/hero-images]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// ─── POST /api/admin/hero-images ──────────────────────────────────────────────
// multipart/form-data: file (required), altText (required), caption (optional), order (optional)

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
      return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400 });
    }
    if (!altText) {
      return NextResponse.json({ success: false, error: "Alt text is required." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPEG, PNG, WebP, and GIF images are accepted." },
        { status: 415 },
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "Image must be smaller than 8 MB." },
        { status: 413 },
      );
    }

    // Auto-assign order = last + 1 if not provided
    let order: number;
    if (orderRaw !== null && !isNaN(parseInt(orderRaw))) {
      order = parseInt(orderRaw);
    } else {
      const last = await HeroImage.findOne({}).sort({ order: -1 }).select("order").lean();
      order = (last?.order ?? -1) + 1;
    }

    // Convert File → Buffer for Cloudinary stream upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { url, publicId } = await uploadToCloudinary(buffer, {
      folder: "foundation/hero",
    });

    const heroImage = await HeroImage.create({
      url,
      publicId,
      altText,
      caption,
      order,
      isActive: true,
      uploadedBy: admin.sub,
    });

    return NextResponse.json({ success: true, data: heroImage }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[POST /api/admin/hero-images]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
