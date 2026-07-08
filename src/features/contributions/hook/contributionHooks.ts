import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";

import {
  getLedger,
  getDefaulters,
  recordContribution,
  reverseContribution,
} from "../api/contributions";

export function useFetchLedger(params?: {
  periodLabel?: string;
  includeReversals?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["contributions", params],
    queryFn: () => getLedger(params),
  });
}

export function useFetchDefaulters(params: { periodLabel: string }) {
  return useQuery({
    queryKey: ["defaulters", params],
    queryFn: () => getDefaulters(params),
    enabled: !!params.periodLabel,
  });
}

export function useRecordContribution() {
  return useMutation({
    mutationFn: recordContribution,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["contributions"] });
      void queryClient.invalidateQueries({ queryKey: ["defaulters"] });
      void queryClient.invalidateQueries({ queryKey: ["member-contributions", data.memberId] });
      void queryClient.invalidateQueries({ queryKey: ["member", data.memberId] });
    },
  });
}

export function useReverseContribution() {
  return useMutation({
    mutationFn: reverseContribution,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["contributions"] });
      void queryClient.invalidateQueries({ queryKey: ["defaulters"] });
      void queryClient.invalidateQueries({ queryKey: ["member-contributions", data.memberId] });
      void queryClient.invalidateQueries({ queryKey: ["member", data.memberId] });
    },
  });
}
