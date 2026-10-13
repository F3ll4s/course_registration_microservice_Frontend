import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getMyWaitlist } from "@/api/enrollments";
import type { SectionRow, WaitlistEntry } from "@/api/types";
import { ALL_SECTIONS, useCatalog } from "@/features/catalog/useCatalog";

export type WaitlistRow = { entry: WaitlistEntry; row: SectionRow };

// The student's waitlist entries, joined with their section and course
export function useWaitlistRows() {
  // Key starts with ["enrollments", "me"] so enroll, drop and claim invalidate it together with enrollments
  const waitlist = useQuery({
    queryKey: ["enrollments", "me", "waitlist"],
    queryFn: getMyWaitlist,
    refetchInterval: 15_000, // queue position and offers change without user action
  });
  const catalog = useCatalog(ALL_SECTIONS);

  const rows = useMemo<WaitlistRow[]>(() => {
    const bySection = new Map(catalog.rows.map((r) => [r.section.id, r]));
    return (waitlist.data ?? []).flatMap((entry) => {
      const row = bySection.get(entry.section_id);
      return row ? [{ entry, row }] : [];
    });
  }, [waitlist.data, catalog.rows]);

  return {
    rows,
    isLoading: waitlist.isLoading || catalog.isLoading,
    error: waitlist.error ?? catalog.error,
  };
}
