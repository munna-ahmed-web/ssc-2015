import { axios } from "@/lib/http";
import type { ApiResponse } from "@/types";

import type { SerializedHeroImage } from "../types/types";

export async function getHeroImages(): Promise<SerializedHeroImage[]> {
  const res = (await axios.get("/api/admin/hero-images")) as unknown as ApiResponse<SerializedHeroImage[]>;
  if (res.success) {
    return res.data;
  }
  throw new Error(res.error || "Failed to fetch hero images");
}

export async function getPublicHeroImages(): Promise<SerializedHeroImage[]> {
  const res = (await axios.get("/api/hero-images")) as unknown as ApiResponse<SerializedHeroImage[]>;
  if (res.success) {
    return res.data;
  }
  throw new Error(res.error || "Failed to fetch hero images");
}

export async function createHeroImage(form: FormData): Promise<SerializedHeroImage> {
  const res = (await axios.post("/api/admin/hero-images", form)) as unknown as ApiResponse<SerializedHeroImage>;
  if (res.success) {
    return res.data;
  }
  throw new Error(res.error || "Failed to upload hero image");
}

export async function updateHeroImage({ id, data }: { id: string; data: { isActive?: boolean; order?: number } }): Promise<SerializedHeroImage> {
  const res = (await axios.patch(`/api/admin/hero-images/${id}`, data)) as unknown as ApiResponse<SerializedHeroImage>;
  if (res.success) {
    return res.data;
  }
  throw new Error(res.error || "Failed to update hero image");
}

export async function deleteHeroImage(id: string): Promise<void> {
  const res = (await axios.delete(`/api/admin/hero-images/${id}`)) as unknown as ApiResponse<void>;
  if (!res.success) {
    throw new Error(res.error || "Failed to delete hero image");
  }
}

