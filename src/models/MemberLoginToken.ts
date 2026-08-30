/**
 * MemberLoginToken model — single-use magic-link tokens for the member portal.
 *
 * Design decisions:
 *  - Only a SHA-256 hash of the token is stored; the raw token exists solely in
 *    the emailed link. A database leak cannot be replayed as a login.
 *  - `expiresAt` carries a TTL index, so MongoDB deletes expired rows itself.
 *  - Single-use: `usedAt` is set atomically on verification; a second click of
 *    the same link fails.
 *  - Rate limiting counts recent rows per member (see the request route).
 */

import type { Document, Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IMemberLoginToken extends Document {
  tokenHash: string; // sha256 hex of the raw token
  memberId: Types.ObjectId;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const memberLoginTokenSchema = new Schema<IMemberLoginToken>(
  {
    tokenHash: {
      type: String,
      required: [true, "Token hash is required"],
      unique: true, // Index defined by unique constraint
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "Member is required"],
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiry is required"],
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "member_login_tokens",
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// TTL: MongoDB removes rows as soon as expiresAt passes
memberLoginTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Rate limiting: count recent requests per member
memberLoginTokenSchema.index({ memberId: 1, createdAt: -1 });

// ─── Model (singleton — safe for Next.js hot-reload) ─────────────────────────

const MemberLoginToken: Model<IMemberLoginToken> =
  (mongoose.models.MemberLoginToken as Model<IMemberLoginToken> | undefined) ??
  mongoose.model<IMemberLoginToken>("MemberLoginToken", memberLoginTokenSchema);

export default MemberLoginToken;
