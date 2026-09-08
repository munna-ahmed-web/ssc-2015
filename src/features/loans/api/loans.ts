import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

import type { FundSummary, LoanFilters, SerializedLoan } from "../types/types";

export async function getLoans(params?: LoanFilters): Promise<{
  loans: SerializedLoan[];
  fund: FundSummary | null;
  overdueCount: number;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}> {
  const res = (await axios.get("/api/admin/loans", { params })) as unknown as ApiResponse<
    SerializedLoan[]
  >;
  assertApiSuccess(res, "Failed to fetch loans");

  const pagination = res.meta?.pagination as
    | { page: number; limit: number; total: number; totalPages: number }
    | undefined;

  return {
    loans: res.data,
    fund: (res.meta?.fund as FundSummary | undefined) ?? null,
    overdueCount: (res.meta?.overdueCount as number | undefined) ?? 0,
    total: pagination?.total ?? 0,
    totalPages: pagination?.totalPages ?? 1,
    page: pagination?.page ?? 1,
    limit: pagination?.limit ?? 25,
  };
}

export async function getLoan(id: string): Promise<SerializedLoan> {
  const res = (await axios.get(`/api/admin/loans/${id}`)) as unknown as ApiResponse<SerializedLoan>;
  assertApiSuccess(res, "Failed to fetch loan");
  return res.data;
}

export async function proposeLoan(data: {
  borrowerName: string;
  borrowerMemberId?: string;
  borrowerPhone?: string;
  purpose?: string;
  principal: number;
  expectedReturnDate: string;
}): Promise<SerializedLoan> {
  const res = (await axios.post(
    "/api/admin/loans",
    data,
  )) as unknown as ApiResponse<SerializedLoan>;
  assertApiSuccess(res, "Failed to propose loan");
  return res.data;
}

export async function approveLoan(id: string): Promise<SerializedLoan> {
  const res = (await axios.patch(`/api/admin/loans/${id}`, {
    action: "approve",
  })) as unknown as ApiResponse<SerializedLoan>;
  assertApiSuccess(res, "Failed to approve loan");
  return res.data;
}

export async function rejectLoan({
  id,
  reason,
}: {
  id: string;
  reason: string;
}): Promise<SerializedLoan> {
  const res = (await axios.patch(`/api/admin/loans/${id}`, {
    action: "reject",
    reason,
  })) as unknown as ApiResponse<SerializedLoan>;
  assertApiSuccess(res, "Failed to reject loan");
  return res.data;
}

export async function recordRepayment({
  id,
  amount,
  paidAt,
  notes,
}: {
  id: string;
  amount: number;
  paidAt?: string;
  notes?: string;
}): Promise<SerializedLoan> {
  const res = (await axios.patch(`/api/admin/loans/${id}`, {
    action: "repayment",
    amount,
    paidAt,
    notes,
  })) as unknown as ApiResponse<SerializedLoan>;
  assertApiSuccess(res, "Failed to record repayment");
  return res.data;
}

export async function writeOffLoan({
  id,
  reason,
}: {
  id: string;
  reason: string;
}): Promise<SerializedLoan> {
  const res = (await axios.patch(`/api/admin/loans/${id}`, {
    action: "write_off",
    reason,
  })) as unknown as ApiResponse<SerializedLoan>;
  assertApiSuccess(res, "Failed to write off loan");
  return res.data;
}
