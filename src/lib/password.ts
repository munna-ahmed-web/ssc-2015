/**
 * Password hashing utilities using bcrypt.
 *
 * Cost factor of 12 is a good balance of security vs. latency (~250ms on
 * a modern server). Increase to 13-14 for higher-security environments.
 */

import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
