import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { ClubContributor } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { apiError, apiSuccess, apiValidationError, handleRouteError } from "@/lib/api/response";

const UpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150).trim().optional(),
  phone: z.string().max(30).trim().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PATCH /api/admin/club/contributors/[id]
 * Rename, update the phone, or deactivate a club contributor. Contributors are
 * never deleted — past collections must keep pointing at a real record.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("BAD_REQUEST", "Invalid contributor ID.", 400);
    }

    const parsed = UpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const contributor = await ClubContributor.findById(id);
    if (!contributor) {
      return apiError("NOT_FOUND", "Contributor not found.", 404);
    }

    const { name, phone, isActive } = parsed.data;
    if (name !== undefined) contributor.name = name;
    if (phone !== undefined) contributor.phone = phone || undefined;
    if (isActive !== undefined) contributor.isActive = isActive;
    await contributor.save();

    await logActivity({
      actorId: admin.sub,
      action: "club.contributor_update",
      entityType: "club",
      entityId: id,
      entityLabel: contributor.name,
      details: { name, phone, isActive },
    });

    return apiSuccess(contributor, { message: "Contributor updated." });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[PATCH /api/admin/club/contributors/:id]");
  }
}
