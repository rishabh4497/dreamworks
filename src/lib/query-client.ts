import { QueryClient } from "@tanstack/react-query";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Treat most reads as "fresh" for 10 minutes; few storefront screens
        // need second-by-second freshness, and the catalog rarely changes.
        staleTime: 10 * 60 * 1000,
        // Keep evicted cache entries for 30 min so navigating away and back
        // doesn't re-fire queries.
        gcTime: 30 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        // Don't refetch on every component remount — pages mounting/unmounting
        // as the user navigates was a major source of wasted requests.
        refetchOnMount: false,
      },
    },
  });
}
