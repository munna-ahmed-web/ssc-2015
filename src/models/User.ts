/**
 * User model — admin accounts only.
 *
 * Members are data records (see Member model); they do NOT have login access in v1.
 * The `role` field is an enum with "member" included for future-proofing only.
 *
 * TOTP 2FA fields:
 *  - `twoFactorSecret`   base32 secret stored here after setup
 *  - `isTwoFactorEnabled` flag flipped to true once the admin verifies their first TOTP code
 */

import type { Document, Model } from "mongoose";
import mongoose, { Schema } from "mongoose";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IUser extends Document {
  name: string;
  email: string;
  password: string; // bcrypt hash
  role: "admin" | "member";
  isTwoFactorEnabled: boolean;
  twoFactorSecret?: string; // base32-encoded, only set after TOTP setup
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name must be at most 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // Index defined below
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never returned in queries unless explicitly requested
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "admin",
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false, // Never returned in queries unless explicitly requested
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// email uniqueness is enforced by `unique: true` on the field above.
// Additional indexes will be added here as query patterns are established.

// ─── Model (singleton — safe for Next.js hot-reload) ─────────────────────────

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>("User", userSchema);

export default User;
