/**
 * lib/queryClient.ts — TanStack Query client
 */

import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 minutes
      gcTime: 1000 * 60 * 10,         // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
})
