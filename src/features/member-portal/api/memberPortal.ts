import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

import type {
  SerializedMemberProfile,
  SerializedMyContribution,
  SerializedMemberStats,
} from "../types/types";

export async function requestLoginLink(identifier: string): Promise<string> {
  const res = (await axios.post("/api/member/auth/request", {
    identifier,
  })) as unknown as ApiResponse<null>;
  assertApiSuccess(res, "Failed to request login link");
  return res.message ?? "Check your email for the login link.";
}

export async function verifyLoginToken(token: string): Promise<void> {
  const res = (await axios.post("/api/member/auth/verify", { token })) as unknown as ApiResponse<{
    fullName: string;
    memberCode: string;
  }>;
  assertApiSuccess(res, "This login link is invalid or has expired");
}

export async function memberLogout(): Promise<void> {
  const res = (await axios.post("/api/member/auth/logout")) as unknown as ApiResponse<null>;
  assertApiSuccess(res, "Failed to log out");
}

export async function getMyProfile(): Promise<SerializedMemberProfile> {
  const res = (await axios.get(
    "/api/member/me",
  )) as unknown as ApiResponse<SerializedMemberProfile>;
  assertApiSuccess(res, "Failed to load your profile");
  return res.data;
}

export async function getMyContributions(params?: { page?: number; limit?: number }): Promise<{
  contributions: SerializedMyContribution[];
  myTotalPaid: number;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}> {
  const res = (await axios.get("/api/member/me/contributions", {
    params,
  })) as unknown as ApiResponse<SerializedMyContribution[]>;
  assertApiSuccess(res, "Failed to load your contributions");

  const pagination = res.meta?.pagination as
    | { page: number; limit: number; total: number; totalPages: number }
    | undefined;

  return {
    contributions: res.data,
    myTotalPaid: (res.meta?.myTotalPaid as number | undefined) ?? 0,
    total: pagination?.total ?? 0,
    totalPages: pagination?.totalPages ?? 1,
    page: pagination?.page ?? 1,
    limit: pagination?.limit ?? 25,
  };
}

export async function getMemberStats(): Promise<SerializedMemberStats> {
  const res = (await axios.get(
    "/api/member/stats",
  )) as unknown as ApiResponse<SerializedMemberStats>;
  assertApiSuccess(res, "Failed to load foundation stats");
  return res.data;
}
