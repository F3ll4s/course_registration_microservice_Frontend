import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

export function AppProvider({ children }: { children: ReactNode }) {
  // Created once per app mount, so the cache survives re-renders
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster theme="light" position="top-right" richColors />
    </QueryClientProvider>
  );
}
