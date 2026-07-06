"use client";

/**
 * Client-readable auth cookies for axios Bearer headers.
 * Separate from httpOnly `access_token` / `refresh_token` set by the server on login.
 */

import { deleteCookie, getCookie, setCookie } from "cookies-next/client";

import { ACCESS_MAX_AGE, REFRESH_MAX_AGE } from "./constants";

export const CLIENT_ACCESS_COOKIE = "client_access_token";
export const CLIENT_REFRESH_COOKIE = "client_refresh_token";

const LEGACY_ACCESS_KEY = "foundation_access_token";
const LEGACY_REFRESH_KEY = "foundation_refresh_token";

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

const cookieOptions = (maxAge: number) => ({
  maxAge,
  path: "/",
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
});

function readCookie(name: string): string | null {
  const value = getCookie(name);
  return typeof value === "string" && value.length > 0 ? value : null;
}

function clearLegacyLocalStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_ACCESS_KEY);
  localStorage.removeItem(LEGACY_REFRESH_KEY);
}

export function setClientTokens(
  accessToken: string,
  refreshToken: string,
  options?: { expiresIn?: number; refreshExpiresIn?: number },
): void {
  memoryAccessToken = accessToken;
  memoryRefreshToken = refreshToken;

  setCookie(CLIENT_ACCESS_COOKIE, accessToken, cookieOptions(options?.expiresIn ?? ACCESS_MAX_AGE));
  setCookie(
    CLIENT_REFRESH_COOKIE,
    refreshToken,
    cookieOptions(options?.refreshExpiresIn ?? REFRESH_MAX_AGE),
  );

  clearLegacyLocalStorage();
}

export function getClientAccessToken(): string | null {
  if (memoryAccessToken) return memoryAccessToken;
  return readCookie(CLIENT_ACCESS_COOKIE);
}

export function getClientRefreshToken(): string | null {
  if (memoryRefreshToken) return memoryRefreshToken;
  return readCookie(CLIENT_REFRESH_COOKIE);
}

export function clearClientTokens(): void {
  memoryAccessToken = null;
  memoryRefreshToken = null;

  deleteCookie(CLIENT_ACCESS_COOKIE, { path: "/" });
  deleteCookie(CLIENT_REFRESH_COOKIE, { path: "/" });
  clearLegacyLocalStorage();
}
