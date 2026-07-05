import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";

import {
  getHeroImages,
  getPublicHeroImages,
  createHeroImage,
  updateHeroImage,
  deleteHeroImage,
} from "../api/heroImages";

export function useFetchHeroImages() {
  return useQuery({
    queryKey: ["hero-images"],
    queryFn: getHeroImages,
  });
}

export function useFetchPublicHeroImages() {
  return useQuery({
    queryKey: ["public-hero-images"],
    queryFn: getPublicHeroImages,
  });
}

export function useCreateHeroImage() {
  return useMutation({
    mutationFn: createHeroImage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hero-images"] });
    },
  });
}

export function useUpdateHeroImage() {
  return useMutation({
    mutationFn: updateHeroImage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hero-images"] });
    },
  });
}

export function useDeleteHeroImage() {
  return useMutation({
    mutationFn: deleteHeroImage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hero-images"] });
    },
  });
}
