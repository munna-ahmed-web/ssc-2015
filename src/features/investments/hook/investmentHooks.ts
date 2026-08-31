import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";

import {
  getInvestments,
  getInvestment,
  proposeInvestment,
  approveInvestment,
  rejectInvestment,
  closeInvestment,
} from "../api/investments";
import type { InvestmentFilters } from "../types/types";

function invalidateInvestmentQueries(id?: string) {
  void queryClient.invalidateQueries({ queryKey: ["investments"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  if (id) {
    void queryClient.invalidateQueries({ queryKey: ["investment", id] });
  }
}

export function useFetchInvestments(params?: InvestmentFilters) {
  return useQuery({
    queryKey: ["investments", params],
    queryFn: () => getInvestments(params),
  });
}

export function useFetchInvestment(id: string) {
  return useQuery({
    queryKey: ["investment", id],
    queryFn: () => getInvestment(id),
    enabled: !!id,
  });
}

export function useProposeInvestment() {
  return useMutation({
    mutationFn: proposeInvestment,
    onSuccess: () => {
      invalidateInvestmentQueries();
    },
  });
}

export function useApproveInvestment() {
  return useMutation({
    mutationFn: approveInvestment,
    onSuccess: (data) => {
      invalidateInvestmentQueries(data._id);
    },
  });
}

export function useRejectInvestment() {
  return useMutation({
    mutationFn: rejectInvestment,
    onSuccess: (data) => {
      invalidateInvestmentQueries(data._id);
    },
  });
}

export function useCloseInvestment() {
  return useMutation({
    mutationFn: closeInvestment,
    onSuccess: (data) => {
      invalidateInvestmentQueries(data._id);
    },
  });
}
