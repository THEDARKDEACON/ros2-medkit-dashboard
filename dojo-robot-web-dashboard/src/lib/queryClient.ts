import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration for server state management
 *
 * Caching Strategy:
 * - Static data (areas, component metadata): 5 minute TTL
 * - Dynamic data (component status, metrics): 30 second TTL
 * - Real-time data (topics, faults): No caching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      staleTime: 30 * 1000, // 30 seconds default
      // GC time: how long unused data stays in cache
      gcTime: 5 * 60 * 1000, // 5 minutes
      // Retry configuration
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
});
