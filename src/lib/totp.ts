/**
 * TOTP (Time-based One-Time Password) utilities for admin 2FA.
 *
 * Uses speakeasy for TOTP generation/verification and the qrcode package
 * to produce a data-URL QR code for authenticator app scanning.
 */

import speakeasy from "speakeasy";
import QRCode from "qrcode";

const ISSUER = process.env.TOTP_ISSUER ?? "FoundationManagement";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TotpSetupResult {
  /** The base32-encoded secret to store (encrypted) in the DB. */
  secret: string;
  /** A data-URL PNG QR code to show to the admin during setup. */
  qrCodeDataUrl: string;
  /** The otpauth:// URI (for manual entry in authenticator apps). */
  otpauthUrl: string;
}

// ─── Generate a new TOTP secret ───────────────────────────────────────────────

export async function generateTotpSecret(
  adminEmail: string
): Promise<TotpSetupResult> {
  const generated = speakeasy.generateSecret({
    name: `${ISSUER} (${adminEmail})`,
    issuer: ISSUER,
    length: 32,
  });

  const otpauthUrl = generated.otpauth_url!;
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return {
    secret: generated.base32,
    qrCodeDataUrl,
    otpauthUrl,
  };
}

// ─── Verify a TOTP code ───────────────────────────────────────────────────────

/**
 * Verifies a 6-digit TOTP token against the stored base32 secret.
 * Allows a ±1 step window (30-second grace period) to handle clock skew.
 */
export function verifyTotpToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1, // ±30 seconds tolerance
  });
}
