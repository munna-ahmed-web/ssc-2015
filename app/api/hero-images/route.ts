import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { HeroImage } from "@/models";

export async function GET() {
  try {
    await connectDB();

    const images = await HeroImage.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: images });
  } catch (err) {
    console.error("[GET /api/hero-images]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
