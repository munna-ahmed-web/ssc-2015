/**
 * Verify MongoDB connection and sync all model indexes to Atlas.
 * Run once after Phase 1 to ensure indexes are created in the DB.
 *
 * Usage: node --env-file=.env.local scripts/sync-indexes.mjs
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");

// ─── Inline schema mirrors (keeps this script dependency-free from TS build) ─

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["admin", "member"], default: "admin" },
    isTwoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
  },
  { timestamps: true, collection: "users" }
);
userSchema.index({ email: 1 }, { unique: true });

const applicationSchema = new mongoose.Schema(
  {
    fullName: String, guardianName: String, phone: String, email: String,
    nid: String, address: String, dateOfBirth: Date, occupation: String,
    photoUrl: String,
    requestedContributionType: { type: String, enum: ["weekly", "monthly"] },
    requestedContributionAmount: Number,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    rejectionReason: String,
    reviewedBy: mongoose.Schema.Types.ObjectId,
    reviewedAt: Date,
    memberId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true, collection: "membership_applications" }
);
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ phone: 1 });
applicationSchema.index({ nid: 1 });

const memberSchema = new mongoose.Schema(
  {
    applicationId: { type: mongoose.Schema.Types.ObjectId, unique: true },
    memberCode: { type: String, unique: true, uppercase: true },
    fullName: String, guardianName: String, phone: String, email: String,
    nid: String, address: String, dateOfBirth: Date, occupation: String, photoUrl: String,
    contributionType: { type: String, enum: ["weekly", "monthly"] },
    contributionAmount: Number,
    status: { type: String, enum: ["active", "suspended", "exited"], default: "active" },
    joinedAt: { type: Date, default: () => new Date() },
    exitedAt: Date, suspendedAt: Date,
    approvedBy: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true, collection: "members" }
);
memberSchema.index({ status: 1, joinedAt: -1 });
memberSchema.index({ fullName: "text" });
memberSchema.index({ phone: 1 });

const contributionSchema = new mongoose.Schema(
  {
    memberId: mongoose.Schema.Types.ObjectId,
    memberName: String,
    contributionType: { type: String, enum: ["weekly", "monthly"] },
    amount: Number,
    periodLabel: String,
    paidAt: { type: Date, default: () => new Date() },
    isReversal: { type: Boolean, default: false },
    reversalOf: mongoose.Schema.Types.ObjectId,
    recordedBy: mongoose.Schema.Types.ObjectId,
    notes: String,
  },
  { timestamps: true, collection: "contributions" }
);
contributionSchema.index(
  { memberId: 1, periodLabel: 1 },
  { unique: true, partialFilterExpression: { isReversal: false }, name: "unique_member_period_non_reversal" }
);
contributionSchema.index({ periodLabel: 1, memberId: 1 });
contributionSchema.index({ memberId: 1, paidAt: -1 });
contributionSchema.index({ paidAt: -1 });

const heroImageSchema = new mongoose.Schema(
  {
    url: String, altText: String, caption: String,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    uploadedBy: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true, collection: "hero_images" }
);
heroImageSchema.index({ isActive: 1, order: 1 });

// ─── Register models ──────────────────────────────────────────────────────────

const models = {
  User: mongoose.models.User ?? mongoose.model("User", userSchema),
  MembershipApplication: mongoose.models.MembershipApplication ?? mongoose.model("MembershipApplication", applicationSchema),
  Member: mongoose.models.Member ?? mongoose.model("Member", memberSchema),
  Contribution: mongoose.models.Contribution ?? mongoose.model("Contribution", contributionSchema),
  HeroImage: mongoose.models.HeroImage ?? mongoose.model("HeroImage", heroImageSchema),
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔗 Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected\n");

  console.log("📋 Syncing indexes for all collections...");
  for (const [name, model] of Object.entries(models)) {
    await model.syncIndexes();
    const indexes = await model.listIndexes();
    console.log(`  ✅ ${name} (${model.collection.collectionName}) — ${indexes.length} index(es):`);
    for (const idx of indexes) {
      console.log(`     • ${JSON.stringify(idx.key)}${idx.unique ? " [unique]" : ""}${idx.partialFilterExpression ? " [partial]" : ""}`);
    }
  }

  console.log("\n✅ All indexes synced successfully.");
}

main()
  .catch((err) => {
    console.error("❌ Index sync failed:", err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
