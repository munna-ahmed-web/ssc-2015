import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

import type { SerializedReport } from "../types/types";

export async function getReport(params: { periodLabel: string }): Promise<SerializedReport> {
  const res = (await axios.get("/api/admin/reports/monthly", {
    params,
  })) as unknown as ApiResponse<SerializedReport>;
  assertApiSuccess(res, "Failed to fetch report data");
  return res.data;
}
