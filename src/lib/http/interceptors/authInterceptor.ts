import Axios, { AxiosError } from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosHeaders } from "axios";

import { API_ROOT_URL } from "config";
import {
  getClientAccessToken,
  getClientRefreshToken,
  setClientTokens,
  clearClientTokens,
} from "@/lib/auth/client-tokens";
import type { ApiResponse } from "@/types";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    retry?: number;
  }
}

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

interface RefreshTokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

const MAX_RETRIES = 1;

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((item) => {
    if (token) {
      item.resolve(token);
    } else {
      item.reject(error);
    }
  });
  failedQueue = [];
};

export function authRequestInterceptor(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const newConfig = { ...config };
  const token = getClientAccessToken();

  if (token) {
    (newConfig.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
  }

  // Always include cookies for same-origin web sessions (httpOnly tokens).
  newConfig.withCredentials = true;

  if (newConfig.data instanceof FormData) {
    (newConfig.headers as AxiosHeaders).delete("Content-Type");
  }

  return newConfig;
}

export async function authResponseInterceptor(
  error: unknown,
  instance: AxiosInstance,
): Promise<unknown> {
  if (!(error instanceof AxiosError)) {
    throw error;
  }

  const originalRequest = error.config;

  if (!originalRequest) {
    throw error;
  }

  if (!originalRequest.retry) {
    originalRequest.retry = 0;
  }

  if (error.response?.status !== 401 || originalRequest.retry >= MAX_RETRIES) {
    throw error;
  }

  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then((token) => {
      (originalRequest.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
      return instance(originalRequest);
    });
  }

  originalRequest.retry += 1;
  isRefreshing = true;

  const clientRefresh = getClientRefreshToken();

  try {
    const refreshAxios = Axios.create({
      baseURL: API_ROOT_URL,
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    const response = await refreshAxios.post<ApiResponse<RefreshTokenData>>(
      "/api/auth/refresh",
      clientRefresh ? { refreshToken: clientRefresh } : {},
    );

    if (!response.data.success) {
      throw new Error("Token refresh failed");
    }

    const { accessToken, refreshToken, expiresIn, refreshExpiresIn } = response.data.data;
    setClientTokens(accessToken, refreshToken, { expiresIn, refreshExpiresIn });

    processQueue(null, accessToken);
    (originalRequest.headers as AxiosHeaders).set("Authorization", `Bearer ${accessToken}`);
    return instance(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    clearClientTokens();
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
}
