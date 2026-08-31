import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

import type { FundSummary, InvestmentFilters, SerializedInvestment } from "../types/types";

export async function getInvestments(params?: InvestmentFilters): Promise<{
  investments: SerializedInvestment[];
  fund: FundSummary | null;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}> {
  const res = (await axios.get("/api/admin/investments", { params })) as unknown as ApiResponse<
    SerializedInvestment[]
  >;
  assertApiSuccess(res, "Failed to fetch investments");

  const pagination = res.meta?.pagination as
    | { page: number; limit: number; total: number; totalPages: number }
    | undefined;

  return {
    investments: res.data,
    fund: (res.meta?.fund as FundSummary | undefined) ?? null,
    total: pagination?.total ?? 0,
    totalPages: pagination?.totalPages ?? 1,
    page: pagination?.page ?? 1,
    limit: pagination?.limit ?? 25,
  };
}

export async function getInvestment(id: string): Promise<SerializedInvestment> {
  const res = (await axios.get(
    `/api/admin/investments/${id}`,
  )) as unknown as ApiResponse<SerializedInvestment>;
  assertApiSuccess(res, "Failed to fetch investment");
  return res.data;
}

export async function proposeInvestment(data: {
  title: string;
  description?: string;
  principal: number;
  expectedReturnDate: string;
}): Promise<SerializedInvestment> {
  const res = (await axios.post(
    "/api/admin/investments",
    data,
  )) as unknown as ApiResponse<SerializedInvestment>;
  assertApiSuccess(res, "Failed to propose investment");
  return res.data;
}

export async function approveInvestment(id: string): Promise<SerializedInvestment> {
  const res = (await axios.patch(`/api/admin/investments/${id}`, {
    action: "approve",
  })) as unknown as ApiResponse<SerializedInvestment>;
  assertApiSuccess(res, "Failed to approve investment");
  return res.data;
}

export async function rejectInvestment({
  id,
  reason,
}: {
  id: string;
  reason: string;
}): Promise<SerializedInvestment> {
  const res = (await axios.patch(`/api/admin/investments/${id}`, {
    action: "reject",
    reason,
  })) as unknown as ApiResponse<SerializedInvestment>;
  assertApiSuccess(res, "Failed to reject investment");
  return res.data;
}

export async function closeInvestment({
  id,
  returnedAmount,
  returnedAt,
  allocations,
}: {
  id: string;
  returnedAmount: number;
  returnedAt?: string;
  allocations: { purpose: string; amount: number }[];
}): Promise<SerializedInvestment> {
  const res = (await axios.patch(`/api/admin/investments/${id}`, {
    action: "close",
    returnedAmount,
    returnedAt,
    allocations,
  })) as unknown as ApiResponse<SerializedInvestment>;
  assertApiSuccess(res, "Failed to close investment");
  return res.data;
}
