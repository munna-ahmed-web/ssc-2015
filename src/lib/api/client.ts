import {
  ApiClientError,
  getApiErrorCode,
  getApiErrorDetails,
  getApiErrorMessage,
} from "@/lib/api/errors";
import type { ApiResponse } from "@/types";

/**
 * Throw a readable `ApiClientError` when a 2xx body still reports failure.
 * Carries the server's code and field details so callers can show both.
 */
export function assertApiSuccess<T>(
  res: ApiResponse<T>,
  fallback: string,
): asserts res is Extract<ApiResponse<T>, { success: true }> {
  if (res.success) return;

  const details = getApiErrorDetails(res);
  const message = getApiErrorMessage(res, fallback);
  const code = getApiErrorCode(res) ?? "UNKNOWN_ERROR";
  throw new ApiClientError(message, code, 0, details);
}
