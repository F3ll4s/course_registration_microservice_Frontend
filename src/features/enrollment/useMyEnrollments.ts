import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getMyEnrollments } from "@/api/enrollments";
import type { SectionRow } from "@/api/types";
import { ALL_SECTIONS, useCatalog } from "@/features/catalog/useCatalog";

// The student's ENROLLED sections, joined with their course (blue on the timetable, View 4 table)
export function useEnrolledRows() {
  const enrollments = useQuery({ queryKey: ["enrollments", "me"], queryFn: getMyEnrollments });
  const catalog = useCatalog(ALL_SECTIONS);

  const rows = useMemo<SectionRow[]>(() => {
    const ids = new Set(
      (enrollments.data ?? []).filter((e) => e.status === "ENROLLED").map((e) => e.section_id),
    );
    return catalog.rows.filter((r) => ids.has(r.section.id));
  }, [enrollments.data, catalog.rows]);

  return {
    rows,
    isLoading: enrollments.isLoading || catalog.isLoading,
    error: enrollments.error ?? catalog.error,
  };
}
