import { useQuery } from "@tanstack/react-query";

import { getAdminProfile, getAuditLogs } from "../api/settings";

export function useFetchAdminProfile() {
  return useQuery({
    queryKey: ["admin-profile"],
    queryFn: getAdminProfile,
  });
}

export function useFetchAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: getAuditLogs,
  });
}
