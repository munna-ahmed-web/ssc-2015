/*
 * Admin account seed script.
 *
 * Run ONCE to create the initial admin account:
 *   node --experimental-vm-modules scripts/seed-admin.mjs
 *   -- or --
 *   npx tsx scripts/seed-admin.ts
 *
 * Set ADMIN_EMAIL and ADMIN_PASSWORD as env vars or edit the defaults below.
 * After seeding, set up TOTP 2FA from the admin dashboard.
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";

// ─── Minimal inline User model (avoids importing compiled TS at seed time) ────
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "member"], default: "admin" },
    isTwoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
  },
  { timestamps: true },
);

const User = mongoose.models.User ?? mongoose.model("User", userSchema);

// ─── Config ───────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/foundation-management";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Super Admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "iamthemunna10@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "sscbatch2015";

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔗 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`⚠️  Admin with email "${ADMIN_EMAIL}" already exists. Skipping.`);
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: hashed,
    role: "admin",
  });

  console.log(`✅ Admin created: ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   ⚠️  Change this password immediately after first login!`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
