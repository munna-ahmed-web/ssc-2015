/**
 * JWT token utilities.
 *
 * Strategy:
 *  - Access token:  short-lived (15 min), sent in Authorization header
 *  - Refresh token: long-lived (7 days), stored in httpOnly Secure cookie
 *
 * Both tokens are signed with separate secrets to allow independent rotation.
 */

import jwt from "jsonwebtoken";

// ─── Environment ──────────────────────────────────────────────────────────────

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error(
    "JWT secrets are not defined. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env.local"
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenPayload {
  sub: string; // Admin user _id (MongoDB ObjectId as string)
  role: "admin" | "member";
  iat?: number;
  exp?: number;
}

// ─── Access Token ─────────────────────────────────────────────────────────────

export function signAccessToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export function signRefreshToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}
