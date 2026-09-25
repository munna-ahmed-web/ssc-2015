/**
 * Client-safe error helpers.
 *
 * Kept free of `next/server` imports so browser bundles (axios interceptors,
 * dialogs, forms) can use the exact same parsing the route handlers produce.
 */

import type { AppError, AppErrorCode } from "@/types/api";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "DUPLICATE_ENTRY"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "PAYLOAD_TOO_LARGE"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SERVER_ERROR";

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, string[]>;
}

// ─── Field-path humanising (shared with the server-side Zod formatter) ────────

/** `expectedReturnDate` → `expected return date`, `period_label` → `period label`. */
function humanizeSegment(segment: string): string {
  return segment
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
}

/** `["allocations", 0, "amount"]` → `Allocations #1 amount`. */
export function humanizeFieldPath(path: readonly PropertyKey[]): string {
  const parts = path.map((segment) =>
    typeof segment === "number" ? `#${segment + 1}` : humanizeSegment(String(segment)),
  );
  const label = parts.filter(Boolean).join(" ");
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : "";
}

/**
 * Prefix a message with its field label, unless the message already names the
 * field — Zod messages like "Returned amount cannot be negative" read worse as
 * "Returned amount: Returned amount cannot be negative".
 */
export function labelFieldMessage(path: readonly PropertyKey[], message: string): string {
  const label = humanizeFieldPath(path);
  if (!label) return message;

  const lastWord = String(path[path.length - 1] ?? "");
  const haystack = message.toLowerCase();
  const alreadyNamed = humanizeSegment(lastWord)
    .split(" ")
    .filter((w) => w.length > 2)
    .every((w) => haystack.includes(w));

  return alreadyNamed ? message : `${label}: ${message}`;
}

const MAX_LISTED_ISSUES = 3;

/** Join labelled messages into one readable sentence, trimming long lists. */
export function joinIssueMessages(messages: string[]): string {
  const unique = [...new Set(messages.filter(Boolean))];
  if (unique.length === 0) return "Validation failed.";

  const shown = unique.slice(0, MAX_LISTED_ISSUES).join("; ");
  const hidden = unique.length - MAX_LISTED_ISSUES;
  return hidden > 0 ? `${shown} (and ${hidden} more problem${hidden > 1 ? "s" : ""})` : shown;
}

/** `"allocations.0.amount"` → `["allocations", 0, "amount"]`. */
export function parseFieldPath(field: string): PropertyKey[] {
  return field.split(".").map((seg) => (/^\d+$/.test(seg) ? Number(seg) : seg));
}

/** Flatten an API `details` map into one readable sentence. */
export function formatFieldErrors(details: Record<string, string[]> | undefined): string {
  if (!details) return "";
  const messages = Object.entries(details).flatMap(([field, msgs]) =>
    // `details` arrives as parsed JSON, so the shape is not guaranteed.
    (Array.isArray(msgs) ? msgs : []).map((msg) =>
      field === "_form" ? msg : labelFieldMessage(parseFieldPath(field), String(msg)),
    ),
  );
  return joinIssueMessages(messages);
}

// ─── Reading an error out of a response body ─────────────────────────────────

/** A message that names no field is useless to the admin — expand the details. */
function isGenericValidationMessage(message: string): boolean {
  return /^validation failed\.?$/i.test(message.trim());
}

/**
 * Parse the error message out of any API JSON body (legacy string or structured
 * error). A bare "Validation failed." is replaced by the per-field details.
 */
export function getApiErrorMessage(body: unknown, fallback = "Something went wrong."): string {
  if (!body || typeof body !== "object") return fallback;

  const err = (body as { error?: unknown }).error;
  let message: string | undefined;

  if (typeof err === "string") {
    message = err;
  } else if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof err.message === "string"
  ) {
    message = err.message;
  } else {
    // Some legacy handlers put the message at the top level.
    const top = (body as { message?: unknown }).message;
    if (typeof top === "string") message = top;
  }

  if (!message?.trim()) return fallback;

  if (isGenericValidationMessage(message)) {
    const fields = formatFieldErrors(getApiErrorDetails(body));
    if (fields && !isGenericValidationMessage(fields)) return fields;
  }

  return message;
}

export function getApiErrorCode(body: unknown): ApiErrorCode | undefined {
  if (!body || typeof body !== "object") return undefined;
  const err = (body as { error?: unknown }).error;
  if (err && typeof err === "object" && "code" in err && typeof err.code === "string") {
    return err.code as ApiErrorCode;
  }
  return undefined;
}

export function getApiErrorDetails(body: unknown): Record<string, string[]> | undefined {
  if (!body || typeof body !== "object") return undefined;
  const err = (body as { error?: unknown }).error;
  if (err && typeof err === "object" && "details" in err) {
    const details = (err as { details?: unknown }).details;
    if (details && typeof details === "object") {
      return details as Record<string, string[]>;
    }
  }
  return undefined;
}

// ─── The error the client throws ─────────────────────────────────────────────

/**
 * A real `Error` subclass so `err instanceof Error` holds in UI catch blocks.
 * Throwing a bare `{ message, code }` object made every dialog fall through to
 * its generic "Something went wrong" fallback and hide the server's message.
 */
export class ApiClientError extends Error implements AppError {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    code: AppErrorCode,
    statusCode: number,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.statusCode = statusCode;
    if (details) this.details = details;
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

/**
 * The single way UI code turns a caught value into text for the user.
 * Falls back only when there is genuinely nothing to show.
 */
export function getErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err;

  if (err && typeof err === "object") {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return fallback;
}
