import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

import type { SerializedGalleryImage } from "../types/types";

export async function getGalleryImages(): Promise<SerializedGalleryImage[]> {
  const res = (await axios.get("/api/admin/gallery-images")) as unknown as ApiResponse<
    SerializedGalleryImage[]
  >;
  assertApiSuccess(res, "Failed to fetch gallery images");
  return res.data;
}

export async function getPublicGalleryImages(): Promise<SerializedGalleryImage[]> {
  const res = (await axios.get("/api/gallery-images")) as unknown as ApiResponse<
    SerializedGalleryImage[]
  >;
  assertApiSuccess(res, "Failed to fetch gallery images");
  return res.data;
}

export async function createGalleryImage(form: FormData): Promise<SerializedGalleryImage> {
  const res = (await axios.post("/api/admin/gallery-images", form)) as unknown as ApiResponse<
    SerializedGalleryImage
  >;
  assertApiSuccess(res, "Failed to upload gallery image");
  return res.data;
}

export async function updateGalleryImage({
  id,
  data,
}: {
  id: string;
  data: { isActive?: boolean; order?: number };
}): Promise<SerializedGalleryImage> {
  const res = (await axios.patch(
    `/api/admin/gallery-images/${id}`,
    data,
  )) as unknown as ApiResponse<SerializedGalleryImage>;
  assertApiSuccess(res, "Failed to update gallery image");
  return res.data;
}

export async function deleteGalleryImage(id: string): Promise<void> {
  const res = (await axios.delete(`/api/admin/gallery-images/${id}`)) as unknown as ApiResponse<{
    id: string;
  }>;
  assertApiSuccess(res, "Failed to delete gallery image");
}
