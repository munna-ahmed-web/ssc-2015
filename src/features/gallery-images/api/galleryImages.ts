import { axios } from "@/lib/http";
import type { ApiResponse } from "@/types";

import type { SerializedGalleryImage } from "../types/types";

export async function getGalleryImages(): Promise<SerializedGalleryImage[]> {
  const res = (await axios.get("/api/admin/gallery-images")) as unknown as ApiResponse<SerializedGalleryImage[]>;
  if (res.success) {
    return res.data;
  }
  throw new Error(res.error || "Failed to fetch gallery images");
}

export async function getPublicGalleryImages(): Promise<SerializedGalleryImage[]> {
  const res = (await axios.get("/api/gallery-images")) as unknown as ApiResponse<SerializedGalleryImage[]>;
  if (res.success) {
    return res.data;
  }
  throw new Error(res.error || "Failed to fetch gallery images");
}

export async function createGalleryImage(form: FormData): Promise<SerializedGalleryImage> {
  const res = (await axios.post("/api/admin/gallery-images", form)) as unknown as ApiResponse<SerializedGalleryImage>;
  if (res.success) {
    return res.data;
  }
  throw new Error(res.error || "Failed to upload gallery image");
}

export async function updateGalleryImage({ id, data }: { id: string; data: { isActive?: boolean; order?: number } }): Promise<SerializedGalleryImage> {
  const res = (await axios.patch(`/api/admin/gallery-images/${id}`, data)) as unknown as ApiResponse<SerializedGalleryImage>;
  if (res.success) {
    return res.data;
  }
  throw new Error(res.error || "Failed to update gallery image");
}

export async function deleteGalleryImage(id: string): Promise<void> {
  const res = (await axios.delete(`/api/admin/gallery-images/${id}`)) as unknown as ApiResponse<void>;
  if (!res.success) {
    throw new Error(res.error || "Failed to delete gallery image");
  }
}
