import { NextResponse } from "next/server";
import { ZodError } from "zod";

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
  | "SERVER_ERROR";

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, string[]>;
}

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

/** Shared catch handler for route try/catch blocks. Re-throws Response from requireAdmin(). */
export function handleRouteError(err: unknown, logLabel: string): Response {
  if (err instanceof Response) return err;

  if (err instanceof ZodError) {
    return apiError("VALIDATION_ERROR", "Validation failed.", 422, err.flatten().fieldErrors);
  }

  if ((err as { code?: number }).code === 11000) {
    return apiError("DUPLICATE_ENTRY", "A duplicate entry was detected.", 409);
  }

  console.error(logLabel, err);
  return apiError("SERVER_ERROR", "Something went wrong. Please try again.", 500);
}

/** Parse error message from any API JSON body (legacy string or structured error). */
export function getApiErrorMessage(body: unknown, fallback = "Something went wrong."): string {
  if (!body || typeof body !== "object") return fallback;
  const err = (body as { error?: unknown }).error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return fallback;
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
