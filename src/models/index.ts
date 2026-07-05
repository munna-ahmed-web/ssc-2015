/**
 * Models barrel — import all models from a single entry point.
 *
 * IMPORTANT: Always import from here (or directly from the model file) before
 * calling `connectDB()`. Mongoose requires all schemas to be registered before
 * queries run, and this import ensures they are.
 *
 * Usage:
 *   import { User, Member, Contribution } from "@/models";
 */

export { default as Contribution } from "./Contribution";
export { default as GalleryImage } from "./GalleryImage";
export { default as HeroImage } from "./HeroImage";
export { default as Member } from "./Member";
export { default as MembershipApplication } from "./MembershipApplication";
export { default as User } from "./User";

// Re-export interfaces for convenient typing
export type { IContribution } from "./Contribution";
export type { IGalleryImage } from "./GalleryImage";
export type { IHeroImage } from "./HeroImage";
export type { IMember, MemberStatus } from "./Member";
export type {
  ApplicationStatus,
  ContributionType,
  IMembershipApplication,
} from "./MembershipApplication";
export type { IUser } from "./User";
