import Axios, { AxiosError } from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosHeaders } from "axios";
import { deleteCookie, getCookie, setCookie } from "cookies-next/client";

import { API_ROOT_URL } from "config";

// Augment Axios config type to carry a retry counter without casting
declare module "axios" {
  interface InternalAxiosRequestConfig {
    retry?: number;
  }
}

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

interface RefreshResponse {
  access: string;
  refresh: string;
}

const ACCESS_COOKIE = "alap_access_Token";
const REFRESH_COOKIE = "alap_refresh_token";
const MAX_RETRIES = 3;

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
  const token = getCookie(ACCESS_COOKIE);

  if (token) {
    (newConfig.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
  }

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

  const refreshToken = getCookie(REFRESH_COOKIE);
  if (!refreshToken) {
    deleteCookie(ACCESS_COOKIE);
    window.location.replace("/auth/sign-in");
    isRefreshing = false;
    throw error;
  }

  try {
    // Plain instance with no interceptors — prevents recursive 401 loops on the refresh call
    const refreshAxios = Axios.create({ baseURL: API_ROOT_URL });
    const response = await refreshAxios.post<RefreshResponse>("/api/auth/token/refresh/", {
      refresh: refreshToken,
    });
    const { access, refresh } = response.data;

    setCookie(ACCESS_COOKIE, access, { maxAge: 60 * 60 * 24 * 7 });
    setCookie(REFRESH_COOKIE, refresh, { maxAge: 60 * 60 * 24 * 90 });

    processQueue(null, access);
    (originalRequest.headers as AxiosHeaders).set("Authorization", `Bearer ${access}`);
    return instance(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    deleteCookie(ACCESS_COOKIE);
    deleteCookie(REFRESH_COOKIE);
    window.location.replace("/en/auth/sign-in");
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
}
