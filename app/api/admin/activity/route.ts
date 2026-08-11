import type { NextRequest } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { AuditLog, User, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/models";
import type { AuditAction, AuditEntityType } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { apiSuccess, handleRouteError } from "@/lib/api/response";

/**
 * GET /api/admin/activity
 *
 * Paginated admin activity feed (audit trail), newest-first.
 * Filters: actorId, entityType, action, from/to (ISO dates).
 * Invalid filter values are ignored rather than rejected.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const actorId = searchParams.get("actorId");
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "25"));

    const filter: Record<string, unknown> = {};
    if (actorId && mongoose.isValidObjectId(actorId)) {
      filter.actorId = new mongoose.Types.ObjectId(actorId);
    }
    if (entityType && (AUDIT_ENTITY_TYPES as readonly string[]).includes(entityType)) {
      filter.entityType = entityType as AuditEntityType;
    }
    if (action && (AUDIT_ACTIONS as readonly string[]).includes(action)) {
      filter.action = action as AuditAction;
    }

    const createdAt: Record<string, Date> = {};
    if (from && !isNaN(Date.parse(from))) createdAt.$gte = new Date(from);
    if (to && !isNaN(Date.parse(to))) createdAt.$lte = new Date(to);
    if (Object.keys(createdAt).length > 0) filter.createdAt = createdAt;

    const [logs, total, actors] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
      User.find({ role: "admin" }).select("name").lean(),
    ]);

    return apiSuccess(logs, {
      meta: {
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        actors,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return handleRouteError(err, "[GET /api/admin/activity]");
  }
}
