import { useQuery } from "@tanstack/react-query";

import { getActivityLogs } from "../api/activity";
import type { ActivityFilters } from "../types/types";

export function useFetchActivityLogs(params?: ActivityFilters) {
  return useQuery({
    queryKey: ["activity-logs", params],
    queryFn: () => getActivityLogs(params),
    // Always show fresh history when navigating to the Activity page —
    // avoids adding cross-slice invalidation to every mutation hook.
    staleTime: 0,
    refetchOnMount: "always",
  });
}
