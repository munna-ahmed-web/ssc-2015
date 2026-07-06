import { getApiErrorMessage } from "@/lib/api/response";
import type { ApiResponse } from "@/types";

/** Throw with a readable message when an API response indicates failure. */
export function assertApiSuccess<T>(
  res: ApiResponse<T>,
  fallback: string,
): asserts res is Extract<ApiResponse<T>, { success: true }> {
  if (!res.success) {
    throw new Error(getApiErrorMessage(res, fallback));
  }
}
