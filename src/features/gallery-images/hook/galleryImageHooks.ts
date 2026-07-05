import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/queryClient";
import {
  getGalleryImages,
  getPublicGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
} from "../api/galleryImages";

export function useFetchGalleryImages() {
  return useQuery({
    queryKey: ["gallery-images"],
    queryFn: getGalleryImages,
  });
}

export function useFetchPublicGalleryImages() {
  return useQuery({
    queryKey: ["public-gallery-images"],
    queryFn: getPublicGalleryImages,
  });
}

export function useCreateGalleryImage() {
  return useMutation({
    mutationFn: createGalleryImage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
    },
  });
}

export function useUpdateGalleryImage() {
  return useMutation({
    mutationFn: updateGalleryImage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
    },
  });
}

export function useDeleteGalleryImage() {
  return useMutation({
    mutationFn: deleteGalleryImage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
    },
  });
}
