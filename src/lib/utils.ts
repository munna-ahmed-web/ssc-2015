import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.warn(`Warning: Missing environment variable: ${key}`);
    return "";
  }
  return value;
}
