import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

import type { SerializedAuditLog, SerializedAdminUser } from "../types/types";

export async function getAdminProfile(): Promise<SerializedAdminUser> {
  const res = (await axios.get("/api/auth/me")) as unknown as ApiResponse<{
    user: SerializedAdminUser;
  }>;
  assertApiSuccess(res, "Failed to fetch admin profile");
  return res.data.user;
}

export async function getAuditLogs(): Promise<SerializedAuditLog[]> {
  const res = (await axios.get("/api/admin/audit-logs")) as unknown as ApiResponse<
    SerializedAuditLog[]
  >;
  assertApiSuccess(res, "Failed to fetch audit logs");
  return res.data;
}
