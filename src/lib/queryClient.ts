import type { DefaultOptions, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

// ────────────────────────────────────────────────────────────
// Default config
// ────────────────────────────────────────────────────────────
const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 1000 * 60 * 2, // 2 min — data stays fresh, avoids unnecessary refetches
    gcTime: 1000 * 60 * 10, // 10 min — keep unused cache in memory
    retry: 1, // retry once on failure (v5: retry: false was too aggressive)
    refetchOnWindowFocus: false, // don't refetch just because user switched tabs
    refetchOnReconnect: true, // do refetch when internet comes back
  },
  mutations: {
    retry: false, // never retry mutations — side effects are not safe to retry
  },
};

// ────────────────────────────────────────────────────────────
// Singleton QueryClient — safe for frontend-only Next.js apps
// ────────────────────────────────────────────────────────────
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// ────────────────────────────────────────────────────────────
// Type helpers (v5 compatible)
// ────────────────────────────────────────────────────────────

// Extracts the resolved return type of an async function
export type ExtractFnReturnType<FnType extends (...args: unknown[]) => unknown> = Awaited<
  ReturnType<FnType>
>; // ✅ v5: use Awaited instead of PromiseValue (no extra package needed)

// Config type for useQuery — omits queryKey and queryFn (you provide those in the hook)
export type QueryConfig<QueryFnType extends (...args: unknown[]) => unknown> = Omit<
  UseQueryOptions<ExtractFnReturnType<QueryFnType>>,
  "queryKey" | "queryFn"
>;

// Config type for useMutation
export type MutationConfig<MutationFnType extends (...args: unknown[]) => unknown> =
  UseMutationOptions<
    ExtractFnReturnType<MutationFnType>,
    AxiosError,
    Parameters<MutationFnType>[0]
  >;
