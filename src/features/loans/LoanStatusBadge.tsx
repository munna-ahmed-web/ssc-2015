import { Badge } from "@/components/ui/badge";
import type { LoanStatus } from "@/models/Loan";

import { LOAN_STATUS_BADGE_CLASSES, LOAN_STATUS_LABELS } from "./types/types";

export default function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return (
    <Badge variant="outline" className={`text-xs ${LOAN_STATUS_BADGE_CLASSES[status]}`}>
      {LOAN_STATUS_LABELS[status]}
    </Badge>
  );
}
