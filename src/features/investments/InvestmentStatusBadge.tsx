import { Badge } from "@/components/ui/badge";
import type { InvestmentStatus } from "@/models/Investment";

import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "./types/types";

export default function InvestmentStatusBadge({ status }: { status: InvestmentStatus }) {
  return (
    <Badge variant="outline" className={`text-xs ${STATUS_BADGE_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
