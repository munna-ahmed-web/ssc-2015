import { Badge } from "@/components/ui/badge";
import type { MemberStatus } from "@/models";

const CONFIG: Record<
  MemberStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  },
  suspended: {
    label: "Suspended",
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  },
  exited: {
    label: "Exited",
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
};

export default function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.active;
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
