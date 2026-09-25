/**
 * Server-only response builders for Route Handlers.
 *
 * Client code must not import from here — it would pull `next/server` into the
 * browser bundle. The parsing side of the same contract lives in ./errors.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { humanizeFieldPath, joinIssueMessages, labelFieldMessage, parseFieldPath } from "./errors";
import type { ApiErrorBody, ApiErrorCode } from "./errors";

export type { ApiErrorCode, ApiErrorBody };

export interface ApiSuccessBody<T> {
  success: true;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailureBody {
  success: false;
  error: ApiErrorBody;
}

export function apiSuccess<T>(
  data: T,
  options?: { message?: string; status?: number; meta?: Record<string, unknown> },
): NextResponse<ApiSuccessBody<T>> {
  return NextResponse.json(
    {
      success: true as const,
      ...(options?.message ? { message: options.message } : {}),
      data,
      ...(options?.meta ? { meta: options.meta } : {}),
    },
    { status: options?.status ?? 200 },
  );
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: Record<string, string[]>,
): NextResponse<ApiFailureBody> {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
}

export function apiUnauthorized(message = "Unauthorized."): NextResponse<ApiFailureBody> {
  return apiError("UNAUTHORIZED", message, 401);
}

export function apiForbidden(message = "Access denied."): NextResponse<ApiFailureBody> {
  return apiError("FORBIDDEN", message, 403);
}

// ─── Validation errors ────────────────────────────────────────────────────────

type ZodIssue = ZodError["issues"][number];

/**
 * Zod's own type errors ("Invalid input: expected number, received undefined")
 * describe the parser, not the form. Say what the admin has to fix instead.
 * Returns the message on its own, for display beside the field.
 */
function fieldIssueMessage(issue: ZodIssue): string {
  if (issue.code === "invalid_type") {
    if (/received (undefined|null|nan)/i.test(issue.message)) return "This field is required.";
    const expected = (issue as { expected?: string }).expected;
    if (expected) return `Must be a valid ${expected}.`;
  }
  return issue.message;
}

/** The same problem, named, for a summary sentence the admin reads at the top. */
function summaryIssueMessage(issue: ZodIssue): string {
  const label = humanizeFieldPath(issue.path);
  if (issue.code === "invalid_type" && label) {
    if (/received (undefined|null|nan)/i.test(issue.message)) return `${label} is required.`;
    const expected = (issue as { expected?: string }).expected;
    if (expected) return `${label} must be a valid ${expected}.`;
  }
  return labelFieldMessage(issue.path, issue.message);
}

/** Field path → messages, keeping nested paths such as `allocations.0.amount`. */
export function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : "_form";
    (fields[key] ??= []).push(fieldIssueMessage(issue));
  }
  return fields;
}

/** One readable sentence naming what is actually wrong, for the admin to read. */
export function zodErrorMessage(error: ZodError): string {
  return joinIssueMessages(error.issues.map(summaryIssueMessage));
}

/**
 * 422 with both a human sentence and per-field details.
 * Prefer this over a hand-written "Validation failed." — the admin cannot act
 * on a message that does not say which field is wrong.
 */
export function apiValidationError(
  error: ZodError,
  fallbackMessage = "Validation failed.",
): NextResponse<ApiFailureBody> {
  const message = error.issues.length ? zodErrorMessage(error) : fallbackMessage;
  return apiError("VALIDATION_ERROR", message, 422, zodFieldErrors(error));
}

// ─── Catch-all ────────────────────────────────────────────────────────────────

interface MongoDuplicateKeyError {
  code?: number;
  keyValue?: Record<string, unknown>;
}

interface MongooseValidationError {
  name?: string;
  errors?: Record<string, { message?: string; path?: string }>;
}

interface MongooseCastError {
  name?: string;
  path?: string;
  value?: unknown;
}

/** Shared catch handler for route try/catch blocks. Re-throws Response from requireAdmin(). */
export function handleRouteError(err: unknown, logLabel: string): Response {
  if (err instanceof Response) return err;

  if (err instanceof ZodError) {
    return apiValidationError(err);
  }

  const dup = err as MongoDuplicateKeyError;
  if (dup.code === 11000) {
    const entries = Object.entries(dup.keyValue ?? {});
    if (entries.length > 0) {
      const [field, value] = entries[0];
      const label = humanizeFieldPath([field]) || "Value";
      return apiError("DUPLICATE_ENTRY", `${label} "${String(value)}" is already in use.`, 409, {
        [field]: [`"${String(value)}" is already in use.`],
      });
    }
    return apiError("DUPLICATE_ENTRY", "A duplicate entry was detected.", 409);
  }

  const mongooseErr = err as MongooseValidationError;
  if (mongooseErr.name === "ValidationError" && mongooseErr.errors) {
    const details: Record<string, string[]> = {};
    for (const [path, detail] of Object.entries(mongooseErr.errors)) {
      details[path] = [detail.message ?? "Invalid value."];
    }
    const message = joinIssueMessages(
      Object.entries(details).map(([path, msgs]) =>
        labelFieldMessage(parseFieldPath(path), msgs[0]),
      ),
    );
    return apiError("VALIDATION_ERROR", message, 422, details);
  }

  const castErr = err as MongooseCastError;
  if (castErr.name === "CastError") {
    const label = castErr.path ? humanizeFieldPath([castErr.path]) : "";
    return apiError(
      "BAD_REQUEST",
      label ? `${label} is not a valid value.` : "A request value has the wrong format.",
      400,
    );
  }

  console.error(logLabel, err);
  return apiError("SERVER_ERROR", "Something went wrong on the server. Please try again.", 500);
}
