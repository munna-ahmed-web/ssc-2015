import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

import type { SerializedApplication } from "../types/types";

export async function getApplications(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  applications: SerializedApplication[];
  total: number;
  totalPages: number;
  limit: number;
  page: number;
}> {
  const res = (await axios.get("/api/admin/applications", { params })) as unknown as ApiResponse<
    SerializedApplication[]
  >;
  assertApiSuccess(res, "Failed to fetch applications list");

  const pagination = res.meta?.pagination as
    | {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    | undefined;

  return {
    applications: res.data,
    total: pagination?.total ?? 0,
    totalPages: pagination?.totalPages ?? 1,
    limit: pagination?.limit ?? 20,
    page: pagination?.page ?? 1,
  };
}

export async function getApplication(id: string): Promise<SerializedApplication> {
  const res = (await axios.get(
    `/api/admin/applications/${id}`,
  )) as unknown as ApiResponse<SerializedApplication>;
  assertApiSuccess(res, "Failed to fetch application detail");
  return res.data;
}

export async function updateApplicationAction({
  id,
  data,
}: {
  id: string;
  data: { action: "approve" } | { action: "reject"; rejectionReason: string };
}): Promise<unknown> {
  const res = (await axios.patch(
    `/api/admin/applications/${id}`,
    data,
  )) as unknown as ApiResponse<unknown>;
  assertApiSuccess(res, "Failed to perform application workflow action");
  return res.data;
}

export async function checkApplicationDuplicates(params: {
  phone?: string;
  nid?: string;
}): Promise<{
  duplicate: boolean;
  conflicts: { field: "phone" | "nid"; status: "pending" | "approved"; message: string }[];
}> {
  const res = (await axios.get("/api/applications/check", { params })) as unknown as ApiResponse<{
    duplicate: boolean;
    conflicts: { field: "phone" | "nid"; status: "pending" | "approved"; message: string }[];
  }>;
  assertApiSuccess(res, "Duplicate check failed");
  return res.data;
}

export async function submitApplication(form: FormData): Promise<unknown> {
  const res = (await axios.post("/api/applications", form)) as unknown as ApiResponse<unknown>;
  assertApiSuccess(res, "Failed to submit application");
  return res.data;
}
