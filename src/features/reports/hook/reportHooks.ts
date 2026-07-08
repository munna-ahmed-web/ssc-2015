import { useQuery } from "@tanstack/react-query";

import { getReport } from "../api/reports";

export function useFetchReport(params: { periodLabel: string }) {
  return useQuery({
    queryKey: ["report", params],
    queryFn: () => getReport(params),
    enabled: !!params.periodLabel,
  });
}
