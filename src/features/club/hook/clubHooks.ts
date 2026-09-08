import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";

import {
  getClubContributors,
  addClubContributor,
  updateClubContributor,
  getClubCollections,
  addClubCollection,
  deleteClubCollection,
  getClubExpenses,
  addClubExpense,
  deleteClubExpense,
} from "../api/club";

function invalidateClub() {
  void queryClient.invalidateQueries({ queryKey: ["club-collections"] });
  void queryClient.invalidateQueries({ queryKey: ["club-expenses"] });
  void queryClient.invalidateQueries({ queryKey: ["club-contributors"] });
}

export function useFetchClubContributors(includeInactive = false) {
  return useQuery({
    queryKey: ["club-contributors", includeInactive],
    queryFn: () => getClubContributors(includeInactive),
  });
}

export function useFetchClubCollections(periodLabel: string) {
  return useQuery({
    queryKey: ["club-collections", periodLabel],
    queryFn: () => getClubCollections(periodLabel),
    enabled: !!periodLabel,
  });
}

export function useFetchClubExpenses(periodLabel: string) {
  return useQuery({
    queryKey: ["club-expenses", periodLabel],
    queryFn: () => getClubExpenses(periodLabel),
    enabled: !!periodLabel,
  });
}

export function useAddClubContributor() {
  return useMutation({ mutationFn: addClubContributor, onSuccess: invalidateClub });
}

export function useUpdateClubContributor() {
  return useMutation({ mutationFn: updateClubContributor, onSuccess: invalidateClub });
}

export function useAddClubCollection() {
  return useMutation({ mutationFn: addClubCollection, onSuccess: invalidateClub });
}

export function useDeleteClubCollection() {
  return useMutation({ mutationFn: deleteClubCollection, onSuccess: invalidateClub });
}

export function useAddClubExpense() {
  return useMutation({ mutationFn: addClubExpense, onSuccess: invalidateClub });
}

export function useDeleteClubExpense() {
  return useMutation({ mutationFn: deleteClubExpense, onSuccess: invalidateClub });
}
