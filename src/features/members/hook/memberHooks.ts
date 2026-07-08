import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";

import { getMembers, getMember, updateMember, getMemberContributions } from "../api/members";

export function useFetchMembers(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["members", params],
    queryFn: () => getMembers(params),
  });
}

export function useFetchMemberById(id: string) {
  return useQuery({
    queryKey: ["member", id],
    queryFn: () => getMember(id),
    enabled: !!id,
  });
}

export function useUpdateMember() {
  return useMutation({
    mutationFn: updateMember,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["member", data._id] });
      void queryClient.invalidateQueries({ queryKey: ["member-contributions", data._id] });
    },
  });
}

export function useFetchMemberContributions(memberId: string) {
  return useQuery({
    queryKey: ["member-contributions", memberId],
    queryFn: () => getMemberContributions(memberId),
    enabled: !!memberId,
  });
}
