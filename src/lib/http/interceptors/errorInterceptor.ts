import { AxiosError } from "axios";

import {
  ApiClientError,
  getApiErrorCode,
  getApiErrorDetails,
  getApiErrorMessage,
} from "@/lib/api/errors";
import type { AppErrorCode } from "@/types/api";

function getErrorCodeFromStatus(status: number): AppErrorCode {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

/** Last-resort text when the server sent no usable message at all. */
function fallbackMessageForStatus(status: number): string {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "The requested record was not found.";
  if (status === 409) return "This action conflicts with the current state of the record.";
  if (status === 413) return "The file you uploaded is too large.";
  if (status === 415) return "That file type is not supported.";
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status >= 500) return "The server could not complete this action. Please try again.";
  return "The request could not be completed.";
}

/**
 * Turn anything axios throws into an `ApiClientError` — a real `Error`, so UI
 * catch blocks that test `err instanceof Error` show the server's message
 * instead of falling through to a generic fallback.
 */
export function normalizeError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;

  if (error instanceof AxiosError) {
    const { response, code } = error;

    if (code === "ECONNABORTED") {
      return new ApiClientError(
        "The request timed out. Please check your connection and try again.",
        "TIMEOUT",
        0,
      );
    }

    if (code === "ERR_CANCELED") {
      return new ApiClientError("The request was cancelled.", "TIMEOUT", 0);
    }

    if (!response) {
      return new ApiClientError(
        "Could not reach the server. Please check your internet connection.",
        "NETWORK_ERROR",
        0,
      );
    }

    const statusCode = response.status;
    const details = getApiErrorDetails(response.data);
    const message = getApiErrorMessage(response.data, fallbackMessageForStatus(statusCode));

    const responseCode = getApiErrorCode(response.data);
    const errorCode = responseCode ?? getErrorCodeFromStatus(statusCode);

    return new ApiClientError(message, errorCode, statusCode, details);
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message, "UNKNOWN_ERROR", 0);
  }

  if (typeof error === "string" && error.trim()) {
    return new ApiClientError(error, "UNKNOWN_ERROR", 0);
  }

  return new ApiClientError("An unexpected error occurred.", "UNKNOWN_ERROR", 0);
}
