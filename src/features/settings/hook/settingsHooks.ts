import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getAdminProfile, getAuditLogs } from "../api/settings";
import type { AuditLogFilters } from "../types/types";

export function useFetchAdminProfile() {
  return useQuery({
    queryKey: ["admin-profile"],
    queryFn: getAdminProfile,
  });
}

export function useFetchAuditLogs(params?: AuditLogFilters) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => getAuditLogs(params),
    // Keep the previous page visible while the next one loads (no flash)
    placeholderData: keepPreviousData,
  });
}
