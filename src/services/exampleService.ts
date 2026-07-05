import { axios } from "@/lib/http";
import type { ApiResponse, User } from "@/types";

export async function getUsers(): Promise<ApiResponse<User[]>> {
  return axios.get("/api/users/");
}

export async function getUserById(id: string): Promise<ApiResponse<User>> {
  return axios.get(`/api/users/${id}/`);
}

export async function createUser(data: Partial<User>): Promise<ApiResponse<User>> {
  return axios.post("/api/users/", data);
}

export async function updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
  return axios.put(`/api/users/${id}/`, data);
}

export async function uploadAvatar(id: string, file: File): Promise<ApiResponse<User>> {
  const form = new FormData();
  form.append("avatar", file);
  return axios.post(`/api/users/${id}/avatar/`, form);
}
