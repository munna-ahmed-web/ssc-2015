import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";
import type { SerializedMember } from "@/features/members/types/types";

import type { SerializedContribution } from "../types/types";

export async function getLedger(params?: {
  periodLabel?: string;
  includeReversals?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  contributions: SerializedContribution[];
  total: number;
  totalPages: number;
  limit: number;
  page: number;
  netCollected: number;
}> {
  const res = (await axios.get("/api/admin/contributions", { params })) as unknown as ApiResponse<
    SerializedContribution[]
  >;
  assertApiSuccess(res, "Failed to fetch contribution ledger");

  const pagination = res.meta?.pagination as
    | {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    | undefined;

  return {
    contributions: res.data,
    total: pagination?.total ?? 0,
    totalPages: pagination?.totalPages ?? 1,
    limit: pagination?.limit ?? 25,
    page: pagination?.page ?? 1,
    netCollected: (res.meta?.netCollected as number) ?? 0,
  };
}

export async function getDefaulters(params: { periodLabel: string }): Promise<SerializedMember[]> {
  const res = (await axios.get("/api/admin/contributions/defaulters", {
    params,
  })) as unknown as ApiResponse<SerializedMember[]>;
  assertApiSuccess(res, "Failed to fetch defaulters");
  return res.data;
}

export async function recordContribution(data: {
  memberId: string;
  periodLabel: string;
  paidAt: string;
  notes?: string;
}): Promise<SerializedContribution> {
  const res = (await axios.post(
    "/api/admin/contributions",
    data,
  )) as unknown as ApiResponse<SerializedContribution>;
  assertApiSuccess(res, "Failed to record contribution");
  return res.data;
}

export async function reverseContribution({
  id,
  notes,
}: {
  id: string;
  notes: string;
}): Promise<SerializedContribution> {
  const res = (await axios.post(`/api/admin/contributions/${id}/reverse`, {
    notes,
  })) as unknown as ApiResponse<SerializedContribution>;
  assertApiSuccess(res, "Failed to reverse contribution");
  return res.data;
}
