import { QueryClient } from "@tanstack/react-query";

/**
 * TanStack Query client with defaults from the specification.
 *
 * - Queries retry up to 3 times, but never for 401, 403, or 404.
 * - Mutations never retry automatically.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        failureCount < 3 &&
        ![401, 403, 404].includes(error.status),
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
