/**
 * Audit trail writer — best-effort activity logging for admin actions.
 *
 * Usage (inside a route handler, AFTER the primary write succeeds):
 *
 *   const admin = await requireAdmin();
 *   ...primary mongoose work...
 *   await logActivity({
 *     actorId: admin.sub,
 *     action: "contribution.record",
 *     entityType: "contribution",
 *     entityId: contribution._id,
 *     entityLabel: member.fullName,
 *     details: { amount, periodLabel },
 *   });
 *
 * Guarantees:
 *  - NEVER throws — a failed audit write must not fail the primary request.
 *  - Resolves `actorName` from the User collection behind a small in-module
 *    cache (3–4 admins → near-100% hit rate). Pass `actorName` to skip the
 *    lookup when the caller already has the user doc (e.g. login route).
 */

import type { Types } from "mongoose";

import { AuditLog, User } from "@/models";
import type { AuditAction, AuditEntityType } from "@/models";

// ─── Actor name cache ─────────────────────────────────────────────────────────

const NAME_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const actorNameCache = new Map<string, { name: string; fetchedAt: number }>();

async function resolveActorName(actorId: string): Promise<string> {
  const cached = actorNameCache.get(actorId);
  if (cached && Date.now() - cached.fetchedAt < NAME_CACHE_TTL_MS) {
    return cached.name;
  }

  const user = await User.findById(actorId).select("name").lean();
  const name = user?.name ?? "Admin";
  actorNameCache.set(actorId, { name, fetchedAt: Date.now() });
  return name;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface LogActivityInput {
  actorId: string; // admin.sub from requireAdmin()
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | Types.ObjectId;
  entityLabel?: string;
  details?: Record<string, unknown>;
  actorName?: string; // Skip the User lookup when the caller already has it
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const actorName = input.actorName ?? (await resolveActorName(input.actorId));

    await AuditLog.create({
      actorId: input.actorId,
      actorName,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      details: input.details,
    });
  } catch (err) {
    // Best-effort by design: log and move on — never break the primary request.
    console.error("[logActivity]", err);
  }
}

/**
 * Build a `{ field: { from, to } }` diff between a loaded document and a
 * validated patch payload. Only fields present in `patch` that actually
 * changed are included. Dates are serialized to ISO strings for storage.
 */
export function buildFieldDiff<T extends object>(
  doc: T,
  patch: Partial<T>,
): Record<string, { from: unknown; to: unknown }> {
  const diff: Record<string, { from: unknown; to: unknown }> = {};

  for (const [key, next] of Object.entries(patch)) {
    if (next === undefined) continue;

    const prev = (doc as Record<string, unknown>)[key];
    const prevValue = prev instanceof Date ? prev.toISOString() : prev;
    const nextValue = next instanceof Date ? next.toISOString() : next;

    if (prevValue !== nextValue) {
      diff[key] = { from: prevValue ?? null, to: nextValue };
    }
  }

  return diff;
}
