import type { AuditAction, AuditEntityType } from "@/models/AuditLog";

/** Serialized audit_logs row as returned by GET /api/admin/activity */
export interface SerializedActivityLog {
  _id: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  entityLabel?: string;
  details?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Admin option for the actor filter dropdown (from meta.actors) */
export interface SerializedActor {
  _id: string;
  name: string;
}

export interface ActivityFilters {
  actorId?: string;
  entityType?: AuditEntityType;
  action?: AuditAction;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

/** Human-readable labels for each audit action */
export const ACTION_LABELS: Record<AuditAction, string> = {
  "contribution.record": "Recorded contribution",
  "contribution.reverse": "Reversed contribution",
  "member.update": "Updated member",
  "member.status_change": "Changed member status",
  "application.approve": "Approved application",
  "application.reject": "Rejected application",
  "hero_image.upload": "Uploaded hero image",
  "hero_image.update": "Updated hero image",
  "hero_image.delete": "Deleted hero image",
  "gallery_image.upload": "Uploaded gallery image",
  "gallery_image.update": "Updated gallery image",
  "gallery_image.delete": "Deleted gallery image",
  "investment.propose": "Proposed investment",
  "investment.approve": "Approved investment",
  "investment.reject": "Rejected investment",
  "investment.close": "Closed investment",
  "auth.login": "Logged in",
};

/** Filter dropdown labels per entity type */
export const ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  contribution: "Contributions",
  member: "Members",
  application: "Applications",
  hero_image: "Hero Images",
  gallery_image: "Gallery Images",
  investment: "Investments",
  auth: "Logins",
};

/** Badge tint classes per entity type (Tailwind) */
export const ENTITY_TYPE_BADGE_CLASSES: Record<AuditEntityType, string> = {
  contribution: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  member: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  application: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  hero_image: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  gallery_image: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  investment: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  auth: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};
