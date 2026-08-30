import { useMutation, useQuery } from "@tanstack/react-query";

import {
  requestLoginLink,
  verifyLoginToken,
  memberLogout,
  getMyProfile,
  getMyContributions,
  getMemberStats,
} from "../api/memberPortal";

export function useRequestLoginLink() {
  return useMutation({ mutationFn: requestLoginLink });
}

export function useVerifyLoginToken() {
  return useMutation({ mutationFn: verifyLoginToken });
}

export function useMemberLogout() {
  return useMutation({ mutationFn: memberLogout });
}

export function useFetchMyProfile() {
  return useQuery({
    queryKey: ["member-portal-profile"],
    queryFn: getMyProfile,
    retry: false, // A 401 means "not logged in" — don't hammer the endpoint
  });
}

export function useFetchMyContributions(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["member-portal-contributions", params],
    queryFn: () => getMyContributions(params),
    retry: false,
  });
}

export function useFetchMemberStats() {
  return useQuery({
    queryKey: ["member-portal-stats"],
    queryFn: getMemberStats,
    retry: false,
  });
}
