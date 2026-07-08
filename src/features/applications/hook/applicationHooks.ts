import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";

import {
  getApplications,
  getApplication,
  updateApplicationAction,
  submitApplication,
} from "../api/applications";

export function useFetchApplications(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["applications", params],
    queryFn: () => getApplications(params),
  });
}

export function useFetchApplicationById(id: string) {
  return useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplication(id),
    enabled: !!id,
  });
}

export function useUpdateApplicationAction() {
  return useMutation({
    mutationFn: updateApplicationAction,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      void queryClient.invalidateQueries({ queryKey: ["application", variables.id] });
      // Invalidate members since approving an application creates a new member
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useSubmitApplication() {
  return useMutation({
    mutationFn: submitApplication,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
