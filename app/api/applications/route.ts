import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { connectDB } from "@/lib/db";
import { MembershipApplication } from "@/models";
import { ApplicationSchema } from "@/lib/validation/application.schema";

/**
 * POST /api/applications
 * Public — no auth required.
 * Validates body, soft-checks for duplicates, creates a pending application.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const data = ApplicationSchema.parse(body);

    // Clean up empty optional fields
    if (data.email === "") data.email = undefined;
    if (data.occupation === "") data.occupation = undefined;

    await MembershipApplication.create({
      ...data,
      dateOfBirth: new Date(data.dateOfBirth),
      status: "pending",
    });

    return NextResponse.json(
      { success: true, message: "Application submitted successfully." },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.flatten().fieldErrors },
        { status: 422 },
      );
    }

    // Mongoose duplicate key — shouldn't happen on applications (no unique fields),
    // but handle gracefully just in case
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { success: false, error: "A duplicate entry was detected." },
        { status: 409 },
      );
    }

    console.error("[POST /api/applications]", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * GET /api/applications/check?phone=xxx&nid=xxx
 * Public — soft duplicate check used by the form (does not block submission).
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const phone = searchParams.get("phone")?.trim();
    const nid = searchParams.get("nid")?.trim();

    if (!phone && !nid) {
      return NextResponse.json({ duplicate: false });
    }

    const orFilter = [];
    if (phone) orFilter.push({ phone });
    if (nid) orFilter.push({ nid });

    const existing = await MembershipApplication.findOne({
      $or: orFilter,
      status: { $in: ["pending", "approved"] },
    })
      .select("status phone nid")
      .lean();

    if (!existing) {
      return NextResponse.json({ duplicate: false });
    }

    return NextResponse.json({
      duplicate: true,
      field: existing.phone === phone ? "phone" : "nid",
      status: existing.status,
    });
  } catch (err) {
    console.error("[GET /api/applications/check]", err);
    return NextResponse.json({ duplicate: false });
  }
}
