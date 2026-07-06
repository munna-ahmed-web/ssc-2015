import { axios } from "@/lib/http";
import { assertApiSuccess } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

import type { SerializedHeroImage } from "../types/types";

export async function getHeroImages(): Promise<SerializedHeroImage[]> {
  const res = (await axios.get("/api/admin/hero-images")) as unknown as ApiResponse<
    SerializedHeroImage[]
  >;
  assertApiSuccess(res, "Failed to fetch hero images");
  return res.data;
}

export async function getPublicHeroImages(): Promise<SerializedHeroImage[]> {
  const res = (await axios.get("/api/hero-images")) as unknown as ApiResponse<
    SerializedHeroImage[]
  >;
  assertApiSuccess(res, "Failed to fetch hero images");
  return res.data;
}

export async function createHeroImage(form: FormData): Promise<SerializedHeroImage> {
  const res = (await axios.post("/api/admin/hero-images", form)) as unknown as ApiResponse<
    SerializedHeroImage
  >;
  assertApiSuccess(res, "Failed to upload hero image");
  return res.data;
}

export async function updateHeroImage({
  id,
  data,
}: {
  id: string;
  data: { isActive?: boolean; order?: number };
}): Promise<SerializedHeroImage> {
  const res = (await axios.patch(`/api/admin/hero-images/${id}`, data)) as unknown as ApiResponse<
    SerializedHeroImage
  >;
  assertApiSuccess(res, "Failed to update hero image");
  return res.data;
}

export async function deleteHeroImage(id: string): Promise<void> {
  const res = (await axios.delete(`/api/admin/hero-images/${id}`)) as unknown as ApiResponse<{
    id: string;
  }>;
  assertApiSuccess(res, "Failed to delete hero image");
}
