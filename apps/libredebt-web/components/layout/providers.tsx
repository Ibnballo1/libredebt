"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";

/**
 * QueryClient Factory Configurator
 * Tuned strictly for fintech data flows:
 * * - staleTime (1 min): Debt ledgers are stable; eliminates aggressive request floods.
 * - gcTime (5 mins): Automatic cache clearing and structural garbage collection.
 * - networkMode ("online"): Locks down execution pools; queries/mutations immediately
 * fail or pause safely if connectivity drops, preventing erratic offline state mutations.
 * - retry: 0 on Mutations: Structural security mechanism to prevent accidental duplicate writes.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        retryDelay: 1000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        networkMode: "online",
      },
      mutations: {
        retry: 0,
        networkMode: "online",
      },
    },
  });
}

// Global browser context singleton cache container
let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server Context: Always render individual transaction query clients
    return makeQueryClient();
  }
  // Browser Context: Inline assignment singleton recycling pattern
  return browserQueryClient ?? (browserQueryClient = makeQueryClient());
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* Centralized Global Notification Engine */}
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              "bg-card border border-border text-foreground shadow-sm font-sans text-sm",
            success: "border-l-2 border-l-accent",
            error: "border-l-2 border-l-destructive",
            warning: "border-l-2 border-l-yellow-500",
          },
        }}
      />

      {/* Developer Toolkit Profiler */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
