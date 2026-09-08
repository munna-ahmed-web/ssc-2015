import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";

import {
  getLoans,
  getLoan,
  proposeLoan,
  approveLoan,
  rejectLoan,
  recordRepayment,
  writeOffLoan,
} from "../api/loans";
import type { LoanFilters } from "../types/types";

function invalidateLoanQueries(id?: string) {
  void queryClient.invalidateQueries({ queryKey: ["loans"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  void queryClient.invalidateQueries({ queryKey: ["investments"] });
  if (id) {
    void queryClient.invalidateQueries({ queryKey: ["loan", id] });
  }
}

export function useFetchLoans(params?: LoanFilters) {
  return useQuery({
    queryKey: ["loans", params],
    queryFn: () => getLoans(params),
  });
}

export function useFetchLoan(id: string) {
  return useQuery({
    queryKey: ["loan", id],
    queryFn: () => getLoan(id),
    enabled: !!id,
  });
}

export function useProposeLoan() {
  return useMutation({
    mutationFn: proposeLoan,
    onSuccess: () => {
      invalidateLoanQueries();
    },
  });
}

export function useApproveLoan() {
  return useMutation({
    mutationFn: approveLoan,
    onSuccess: (data) => {
      invalidateLoanQueries(data._id);
    },
  });
}

export function useRejectLoan() {
  return useMutation({
    mutationFn: rejectLoan,
    onSuccess: (data) => {
      invalidateLoanQueries(data._id);
    },
  });
}

export function useRecordRepayment() {
  return useMutation({
    mutationFn: recordRepayment,
    onSuccess: (data) => {
      invalidateLoanQueries(data._id);
    },
  });
}

export function useWriteOffLoan() {
  return useMutation({
    mutationFn: writeOffLoan,
    onSuccess: (data) => {
      invalidateLoanQueries(data._id);
    },
  });
}
