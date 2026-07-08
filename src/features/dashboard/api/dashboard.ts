import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";
import type { DashboardStats } from "@/lib/dashboard";

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = (await axios.get("/api/admin/dashboard")) as unknown as ApiResponse<DashboardStats>;
  assertApiSuccess(res, "Failed to fetch dashboard stats");
  return res.data;
}
