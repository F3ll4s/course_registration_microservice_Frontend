import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getCourses, getSections } from "@/api/catalog";
import type { Day, SectionRow } from "@/api/types";

export type CatalogFilters = { search: string; department: string; day?: Day; openOnly: boolean };

export function useCatalog(f: CatalogFilters) {
  // While a new search or filter loads, the previous results stay on screen instead of a loading notice
  const courses = useQuery({
    queryKey: ["courses", f.search, f.department],
    queryFn: () => getCourses({ search: f.search, department: f.department }),
    placeholderData: keepPreviousData,
  });
  const sections = useQuery({
    queryKey: ["sections", f.day, f.openOnly],
    queryFn: () => getSections({ day: f.day, open_only: f.openOnly }),
    placeholderData: keepPreviousData,
    refetchInterval: 10_000, // live seat counts
  });

  // Only sections whose course matched the search/department filter are shown.
  const rows = useMemo<SectionRow[]>(() => {
    const byCode = new Map((courses.data ?? []).map((c) => [c.code, c]));
    return (sections.data ?? []).flatMap((section) => {
      const course = byCode.get(section.course_code);
      return course ? [{ section, course }] : [];
    });
  }, [courses.data, sections.data]);

  return {
    rows,
    isLoading: courses.isLoading || sections.isLoading,
    error: courses.error ?? sections.error,
  };
}

// No filters: every section. Used to join section ids (cart, enrollments, waitlist) with their course.
export const ALL_SECTIONS: CatalogFilters = { search: "", department: "", openOnly: false };
