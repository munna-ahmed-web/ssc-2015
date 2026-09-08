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

export { default as AuditLog } from "./AuditLog";
export { default as ClubCollection } from "./ClubCollection";
export { default as ClubContributor } from "./ClubContributor";
export { default as ClubExpense } from "./ClubExpense";
export { default as Contribution } from "./Contribution";
export { default as GalleryImage } from "./GalleryImage";
export { default as HeroImage } from "./HeroImage";
export { default as Investment } from "./Investment";
export { default as Loan } from "./Loan";
export { default as Member } from "./Member";
export { default as MemberLoginToken } from "./MemberLoginToken";
export { default as MembershipApplication } from "./MembershipApplication";
export { default as User } from "./User";

// Re-export interfaces for convenient typing
export { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "./AuditLog";
export type { AuditAction, AuditEntityType, IAuditLog } from "./AuditLog";
export type { IClubCollection } from "./ClubCollection";
export type { IClubContributor } from "./ClubContributor";
export type { IClubExpense } from "./ClubExpense";
export type { IContribution } from "./Contribution";
export type { IGalleryImage } from "./GalleryImage";
export type { IHeroImage } from "./HeroImage";
export type { IInvestment, IProfitAllocation, InvestmentStatus } from "./Investment";
export type { ILoan, ILoanRepayment, LoanStatus } from "./Loan";
export type { IMember, MemberStatus } from "./Member";
export type { IMemberLoginToken } from "./MemberLoginToken";
export type {
  ApplicationStatus,
  ContributionType,
  IMembershipApplication,
} from "./MembershipApplication";
export type { IUser } from "./User";
