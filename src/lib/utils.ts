import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extract the admin name from a possibly-populated User ref */
export function adminName(ref: string | { name?: string } | null | undefined): string | undefined {
  return typeof ref === "object" && ref !== null ? ref.name : undefined;
}

export function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.warn(`Warning: Missing environment variable: ${key}`);
    return "";
  }
  return value;
}
