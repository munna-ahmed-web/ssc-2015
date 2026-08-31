import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

import type {
  MyContributionFilters,
  MyContributionSummary,
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

export async function getMyContributions(params?: MyContributionFilters): Promise<{
  contributions: SerializedMyContribution[];
  summary: MyContributionSummary;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}> {
  const res = (await axios.get("/api/member/me/contributions", {
    params,
  })) as unknown as ApiResponse<SerializedMyContribution[]>;
  assertApiSuccess(res, "Failed to load your contributions");

  const meta = (res.meta ?? {}) as Record<string, unknown>;
  const pagination = meta.pagination as
    | { page: number; limit: number; total: number; totalPages: number }
    | undefined;

  return {
    contributions: res.data,
    summary: {
      myTotalPaid: (meta.myTotalPaid as number | undefined) ?? 0,
      paymentsCount: (meta.paymentsCount as number | undefined) ?? 0,
      lastPaidAt: (meta.lastPaidAt as string | null | undefined) ?? null,
      thisYearTotal: (meta.thisYearTotal as number | undefined) ?? 0,
      yearlyBreakdown:
        (meta.yearlyBreakdown as MyContributionSummary["yearlyBreakdown"] | undefined) ?? [],
      availableYears: (meta.availableYears as number[] | undefined) ?? [],
      currentPeriodLabel: (meta.currentPeriodLabel as string | undefined) ?? "",
      currentPeriodPaid: (meta.currentPeriodPaid as boolean | undefined) ?? false,
    },
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
