import type { NextRequest } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { ClubCollection } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";

/**
 * DELETE /api/admin/club/collections/[id]
 *
 * The club ledger is small and informal, so mistaken entries are deleted
 * outright rather than reversed. Every delete is written to the Activity Log
 * with the amount and person, so the history stays traceable.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return apiError("BAD_REQUEST", "Invalid collection ID.", 400);
    }

    const collection = await ClubCollection.findById(id);
    if (!collection) {
      return apiError("NOT_FOUND", "Collection entry not found.", 404);
    }

    const snapshot = {
      amount: collection.amount,
      periodLabel: collection.periodLabel,
      contributorName: collection.contributorName,
    };

    await collection.deleteOne();

    await logActivity({
      actorId: admin.sub,
      action: "club.collection_delete",
      entityType: "club",
      entityId: id,
      entityLabel: snapshot.contributorName,
      details: snapshot,
    });

    return apiSuccess({ id }, { message: "Collection entry deleted." });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[DELETE /api/admin/club/collections/:id]");
  }
}
