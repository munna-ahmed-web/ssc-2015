import type { NextRequest } from "next/server";

import { connectDB } from "@/lib/db";
import { apiSuccess } from "@/lib/api/response";
import { findApplicationDuplicates } from "@/lib/applications/duplicate-check";

/**
 * GET /api/applications/check?phone=...&nid=...
 * Public pre-flight duplicate check for web and mobile clients.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const phone = searchParams.get("phone")?.trim() ?? "";
    const nid = searchParams.get("nid")?.trim() ?? "";

    if (!phone && !nid) {
      return apiSuccess({
        duplicate: false,
        conflicts: [],
      });
    }

    const result = await findApplicationDuplicates(phone, nid);

    return apiSuccess({
      duplicate: result.duplicate,
      conflicts: result.conflicts,
    });
  } catch (err) {
    console.error("[GET /api/applications/check]", err);
    // Non-blocking check — return safe default on failure
    return apiSuccess({
      duplicate: false,
      conflicts: [],
    });
  }
}
