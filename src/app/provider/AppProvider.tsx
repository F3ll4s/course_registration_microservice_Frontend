import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/features/auth/store";

export function AppProvider({ children }: { children: ReactNode }) {
  // Created once per app mount, so the cache survives re-renders
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
  );

  // Cached enrollments and waitlist belong to one student: drop them on logout or account switch,
  // so the next student never sees the previous student's timetable, even for a moment
  useEffect(
    () =>
      useAuthStore.subscribe((state, prev) => {
        if (state.studentId !== prev.studentId) queryClient.clear();
      }),
    [queryClient],
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster theme="light" position="bottom-right" />
    </QueryClientProvider>
  );
}
