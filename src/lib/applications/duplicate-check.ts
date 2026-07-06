import { MembershipApplication } from "@/models";
import type { ApplicationStatus } from "@/models";

export type DuplicateField = "phone" | "nid";
type ActiveApplicationStatus = Extract<ApplicationStatus, "pending" | "approved">;

const ACTIVE_STATUSES: ActiveApplicationStatus[] = ["pending", "approved"];

export interface ApplicationDuplicateConflict {
  field: DuplicateField;
  status: ActiveApplicationStatus;
  message: string;
}

export interface ApplicationDuplicateResult {
  duplicate: boolean;
  conflicts: ApplicationDuplicateConflict[];
  /** Field-keyed messages for API `details` payloads. */
  fieldErrors: Record<string, string[]>;
}

function conflictMessage(field: DuplicateField, status: ActiveApplicationStatus): string {
  if (field === "phone") {
    return status === "pending"
      ? "An application with this phone number is already pending review."
      : "This phone number is already associated with an approved member.";
  }
  return status === "pending"
    ? "An application with this National ID is already pending review."
    : "This National ID is already associated with an approved member.";
}

/**
 * Returns conflicts when phone or NID matches an existing pending or approved application.
 * Rejected applications are ignored so applicants may re-apply after rejection.
 */
export async function findApplicationDuplicates(
  phone: string,
  nid: string,
): Promise<ApplicationDuplicateResult> {
  const activeFilter = { status: { $in: ACTIVE_STATUSES } };

  const [phoneMatch, nidMatch] = await Promise.all([
    MembershipApplication.findOne({ phone, ...activeFilter }).select("status").lean(),
    MembershipApplication.findOne({ nid, ...activeFilter }).select("status").lean(),
  ]);

  const conflicts: ApplicationDuplicateConflict[] = [];
  const fieldErrors: Record<string, string[]> = {};

  if (phoneMatch && ACTIVE_STATUSES.includes(phoneMatch.status as ActiveApplicationStatus)) {
    const status = phoneMatch.status as ActiveApplicationStatus;
    conflicts.push({
      field: "phone",
      status,
      message: conflictMessage("phone", status),
    });
    fieldErrors.phone = [conflictMessage("phone", status)];
  }

  if (nidMatch && ACTIVE_STATUSES.includes(nidMatch.status as ActiveApplicationStatus)) {
    const status = nidMatch.status as ActiveApplicationStatus;
    conflicts.push({
      field: "nid",
      status,
      message: conflictMessage("nid", status),
    });
    fieldErrors.nid = [conflictMessage("nid", status)];
  }

  return {
    duplicate: conflicts.length > 0,
    conflicts,
    fieldErrors,
  };
}

export function duplicateSummaryMessage(conflicts: ApplicationDuplicateConflict[]): string {
  if (conflicts.length === 1) return conflicts[0].message;
  return "An application with this phone number or National ID already exists.";
}
