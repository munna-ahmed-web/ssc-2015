import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

import type { AuditLogFilters, SerializedAuditLog, SerializedAdminUser } from "../types/types";

export async function getAdminProfile(): Promise<SerializedAdminUser> {
  const res = (await axios.get("/api/auth/me")) as unknown as ApiResponse<{
    user: SerializedAdminUser;
  }>;
  assertApiSuccess(res, "Failed to fetch admin profile");
  return res.data.user;
}

export async function getAuditLogs(params?: AuditLogFilters): Promise<{
  logs: SerializedAuditLog[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}> {
  const res = (await axios.get("/api/admin/audit-logs", { params })) as unknown as ApiResponse<
    SerializedAuditLog[]
  >;
  assertApiSuccess(res, "Failed to fetch audit logs");

  const pagination = res.meta?.pagination as
    | { page: number; limit: number; total: number; totalPages: number }
    | undefined;

  return {
    logs: res.data,
    total: pagination?.total ?? res.data.length,
    totalPages: pagination?.totalPages ?? 1,
    page: pagination?.page ?? 1,
    limit: pagination?.limit ?? 10,
  };
}
