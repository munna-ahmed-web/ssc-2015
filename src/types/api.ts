export type AppErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "DUPLICATE_ENTRY"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export interface AppError {
  message: string;
  code: AppErrorCode;
  statusCode: number;
  details?: Record<string, string[]>;
}
