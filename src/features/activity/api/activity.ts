import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

import type { ActivityFilters, SerializedActivityLog, SerializedActor } from "../types/types";

export async function getActivityLogs(params?: ActivityFilters): Promise<{
  logs: SerializedActivityLog[];
  actors: SerializedActor[];
  total: number;
  totalPages: number;
  limit: number;
  page: number;
}> {
  const res = (await axios.get("/api/admin/activity", { params })) as unknown as ApiResponse<
    SerializedActivityLog[]
  >;
  assertApiSuccess(res, "Failed to fetch activity logs");

  const pagination = res.meta?.pagination as
    | {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    | undefined;

  return {
    logs: res.data,
    actors: (res.meta?.actors as SerializedActor[] | undefined) ?? [],
    total: pagination?.total ?? 0,
    totalPages: pagination?.totalPages ?? 1,
    limit: pagination?.limit ?? 25,
    page: pagination?.page ?? 1,
  };
}
