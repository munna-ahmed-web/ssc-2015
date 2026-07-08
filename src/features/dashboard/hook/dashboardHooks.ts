import { useQuery } from "@tanstack/react-query";

import { getDashboardStats } from "../api/dashboard";

export function useFetchDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });
}
