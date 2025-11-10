"use client";
import { QueryClient } from "@tanstack/react-query";

// Create a global QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1, // optional: retry failed requests once
    },
  },
});
