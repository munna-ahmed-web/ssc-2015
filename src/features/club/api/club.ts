import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

import type {
  ClubSummary,
  SerializedClubCollection,
  SerializedClubContributor,
  SerializedClubExpense,
} from "../types/types";

// ─── Contributors ─────────────────────────────────────────────────────────────

export async function getClubContributors(
  includeInactive = false,
): Promise<SerializedClubContributor[]> {
  const res = (await axios.get("/api/admin/club/contributors", {
    params: includeInactive ? { includeInactive: true } : undefined,
  })) as unknown as ApiResponse<SerializedClubContributor[]>;
  assertApiSuccess(res, "Failed to fetch club contributors");
  return res.data;
}

export async function addClubContributor(data: {
  name: string;
  phone?: string;
}): Promise<SerializedClubContributor> {
  const res = (await axios.post(
    "/api/admin/club/contributors",
    data,
  )) as unknown as ApiResponse<SerializedClubContributor>;
  assertApiSuccess(res, "Failed to add contributor");
  return res.data;
}

export async function updateClubContributor({
  id,
  ...data
}: {
  id: string;
  name?: string;
  phone?: string;
  isActive?: boolean;
}): Promise<SerializedClubContributor> {
  const res = (await axios.patch(
    `/api/admin/club/contributors/${id}`,
    data,
  )) as unknown as ApiResponse<SerializedClubContributor>;
  assertApiSuccess(res, "Failed to update contributor");
  return res.data;
}

// ─── Collections ──────────────────────────────────────────────────────────────

export async function getClubCollections(periodLabel: string): Promise<{
  collections: SerializedClubCollection[];
  summary: ClubSummary | null;
}> {
  const res = (await axios.get("/api/admin/club/collections", {
    params: { periodLabel },
  })) as unknown as ApiResponse<SerializedClubCollection[]>;
  assertApiSuccess(res, "Failed to fetch club collections");
  return {
    collections: res.data,
    summary: (res.meta?.summary as ClubSummary | undefined) ?? null,
  };
}

export async function addClubCollection(data: {
  contributorId: string;
  amount: number;
  periodLabel: string;
  paidAt?: string;
  notes?: string;
}): Promise<SerializedClubCollection> {
  const res = (await axios.post(
    "/api/admin/club/collections",
    data,
  )) as unknown as ApiResponse<SerializedClubCollection>;
  assertApiSuccess(res, "Failed to record collection");
  return res.data;
}

export async function deleteClubCollection(id: string): Promise<void> {
  const res = (await axios.delete(`/api/admin/club/collections/${id}`)) as unknown as ApiResponse<{
    id: string;
  }>;
  assertApiSuccess(res, "Failed to delete collection");
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function getClubExpenses(periodLabel: string): Promise<{
  expenses: SerializedClubExpense[];
  summary: ClubSummary | null;
}> {
  const res = (await axios.get("/api/admin/club/expenses", {
    params: { periodLabel },
  })) as unknown as ApiResponse<SerializedClubExpense[]>;
  assertApiSuccess(res, "Failed to fetch club expenses");
  return {
    expenses: res.data,
    summary: (res.meta?.summary as ClubSummary | undefined) ?? null,
  };
}

export async function addClubExpense(data: {
  title: string;
  amount: number;
  periodLabel: string;
  spentAt?: string;
  notes?: string;
}): Promise<SerializedClubExpense> {
  const res = (await axios.post(
    "/api/admin/club/expenses",
    data,
  )) as unknown as ApiResponse<SerializedClubExpense>;
  assertApiSuccess(res, "Failed to record expense");
  return res.data;
}

export async function deleteClubExpense(id: string): Promise<void> {
  const res = (await axios.delete(`/api/admin/club/expenses/${id}`)) as unknown as ApiResponse<{
    id: string;
  }>;
  assertApiSuccess(res, "Failed to delete expense");
}
