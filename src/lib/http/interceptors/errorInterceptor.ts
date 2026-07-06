import { AxiosError } from "axios";

import { getApiErrorCode, getApiErrorDetails, getApiErrorMessage } from "@/lib/api/response";
import type { AppError, AppErrorCode } from "@/types/api";

function getErrorCodeFromStatus(status: number): AppErrorCode {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AxiosError) {
    const { response, code, message } = error;

    if (code === "ECONNABORTED" || code === "ERR_CANCELED") {
      return { message: "Request timed out", code: "TIMEOUT", statusCode: 0 };
    }

    if (!response) {
      return {
        message: "Network error — no response received",
        code: "NETWORK_ERROR",
        statusCode: 0,
      };
    }

    const statusCode = response.status;
    const responseData = response.data;
    const responseMessage = getApiErrorMessage(responseData, message);
    const responseCode = getApiErrorCode(responseData);
    const errorCode = (responseCode as AppErrorCode | undefined) ?? getErrorCodeFromStatus(statusCode);
    const details = getApiErrorDetails(responseData);

    const appError: AppError = { message: responseMessage, code: errorCode, statusCode };
    if (details) {
      appError.details = details;
    }

    return appError;
  }

  if (error instanceof Error) {
    return { message: error.message, code: "UNKNOWN_ERROR", statusCode: 0 };
  }

  return { message: "An unexpected error occurred", code: "UNKNOWN_ERROR", statusCode: 0 };
}
