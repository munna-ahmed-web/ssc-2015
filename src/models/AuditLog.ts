/**
 * AuditLog model — append-only admin activity trail.
 *
 * Design decisions:
 *  - APPEND-ONLY: rows are never edited or deleted (same philosophy as the
 *    Contribution ledger). No TTL — history is kept forever for transparency.
 *  - `actorName` is denormalized (same precedent as `Contribution.memberName`)
 *    so entries survive an admin rename/deletion without needing a populate.
 *  - `details` holds free-form context: a `{ field: { from, to } }` diff for
 *    updates, or key facts (amount, periodLabel, rejectionReason, …) otherwise.
 *  - Writes go through `logActivity()` in @/lib/audit — best-effort, never
 *    fails the primary request.
 */

import type { Document, Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

// ─── Action / entity enums ────────────────────────────────────────────────────

export const AUDIT_ACTIONS = [
  "contribution.record",
  "contribution.reverse",
  "member.update",
  "member.status_change",
  "application.approve",
  "application.reject",
  "hero_image.upload",
  "hero_image.update",
  "hero_image.delete",
  "gallery_image.upload",
  "gallery_image.update",
  "gallery_image.delete",
  "investment.propose",
  "investment.approve",
  "investment.reject",
  "investment.close",
  "auth.login",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITY_TYPES = [
  "contribution",
  "member",
  "application",
  "hero_image",
  "gallery_image",
  "investment",
  "auth",
] as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IAuditLog extends Document {
  actorId: Types.ObjectId; // Admin (User) who performed the action

  // Denormalized so the trail stays readable even if the admin is renamed/removed
  actorName: string;

  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: Types.ObjectId; // Optional — auth events have no target entity
  entityLabel?: string; // Human-readable target, e.g. "Rahim Uddin"

  details?: Record<string, unknown>; // Diff or contextual facts

  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Actor is required"],
    },
    actorName: {
      type: String,
      required: [true, "Actor name is required (denormalized)"],
      trim: true,
    },
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: [true, "Action is required"],
    },
    entityType: {
      type: String,
      enum: AUDIT_ENTITY_TYPES,
      required: [true, "Entity type is required"],
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    entityLabel: {
      type: String,
      trim: true,
      maxlength: [200, "Entity label must be at most 200 characters"],
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: "audit_logs",
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Main feed: newest-first
auditLogSchema.index({ createdAt: -1 });

// Filter by admin
auditLogSchema.index({ actorId: 1, createdAt: -1 });

// Filter by entity type
auditLogSchema.index({ entityType: 1, createdAt: -1 });

// ─── Model (singleton — safe for Next.js hot-reload) ─────────────────────────

const AuditLog: Model<IAuditLog> =
  (mongoose.models.AuditLog as Model<IAuditLog> | undefined) ??
  mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export default AuditLog;
