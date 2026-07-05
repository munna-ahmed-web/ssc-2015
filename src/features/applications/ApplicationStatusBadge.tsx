import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/models";

const CONFIG: Record<ApplicationStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  },
  approved: {
    label: "Approved",
    className:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
};

export default function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const { label, className } = CONFIG[status] ?? CONFIG.pending;
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
