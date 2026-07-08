import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

import type { SerializedMember, SerializedContribution } from "../types/types";

export async function getMembers(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  members: SerializedMember[];
  total: number;
  totalPages: number;
  limit: number;
  page: number;
}> {
  const res = (await axios.get("/api/admin/members", { params })) as unknown as ApiResponse<
    SerializedMember[]
  >;
  assertApiSuccess(res, "Failed to fetch members list");

  const pagination = res.meta?.pagination as
    | {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    | undefined;

  return {
    members: res.data,
    total: pagination?.total ?? 0,
    totalPages: pagination?.totalPages ?? 1,
    limit: pagination?.limit ?? 20,
    page: pagination?.page ?? 1,
  };
}

export async function getMember(id: string): Promise<SerializedMember> {
  const res = (await axios.get(
    `/api/admin/members/${id}`,
  )) as unknown as ApiResponse<SerializedMember>;
  assertApiSuccess(res, "Failed to fetch member detail");
  return res.data;
}

export async function updateMember({
  id,
  data,
}: {
  id: string;
  data: Partial<SerializedMember> & { status?: string };
}): Promise<SerializedMember> {
  const res = (await axios.patch(
    `/api/admin/members/${id}`,
    data,
  )) as unknown as ApiResponse<SerializedMember>;
  assertApiSuccess(res, "Failed to update member");
  return res.data;
}

export async function getMemberContributions(memberId: string): Promise<SerializedContribution[]> {
  const res = (await axios.get("/api/admin/contributions", {
    params: { memberId, includeReversals: true, limit: 100 },
  })) as unknown as ApiResponse<SerializedContribution[]>;
  assertApiSuccess(res, "Failed to fetch member contributions");
  return res.data;
}
