export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
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
