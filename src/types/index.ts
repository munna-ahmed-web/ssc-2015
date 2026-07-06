/**
 * Application-wide type definitions shared across the codebase.
 *
 * Models are defined in /src/models/*.ts (Phase 1).
 * This file contains lightweight shared types used in lib utilities
 * and API route handlers.
 */

// ─── Roles ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "member";

// ─── User (lightweight DTO — full model defined in /src/models in Phase 1) ───

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isTwoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── API response envelopes ───────────────────────────────────────────────────

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiFailure;

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Contribution period helpers ──────────────────────────────────────────────

export type ContributionType = "weekly" | "monthly";

/**
 * Generates a canonical period label string.
 *
 * Examples:
 *  - monthly:  "2026-07"
 *  - weekly:   "2026-W27"
 */
export function getPeriodLabel(type: ContributionType, date = new Date()): string {
  if (type === "monthly") {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  // ISO week number
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
