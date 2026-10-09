import { useQueries } from "@tanstack/react-query";
import { validatePrereqs } from "@/api/catalog";
import type { PrereqResult, SectionRow } from "@/api/types";
import { useAuthStore } from "@/features/auth/store";

export function usePrereqChecks(cart: SectionRow[], completed: string[] | undefined) {
  const studentId = useAuthStore((s) => s.studentId);
  const results = useQueries({
    queries: cart.map((r) => ({
      queryKey: ["prereqs", studentId, r.course.code, completed],
      queryFn: () =>
        validatePrereqs({
          student_id: studentId as string,
          course_code: r.course.code,
          completed_courses: completed as string[],
        }),
      enabled: !!studentId && !!completed,
    })),
  });

  const byCode: Record<string, PrereqResult | undefined> = {};
  cart.forEach((r, i) => {
    byCode[r.course.code] = results[i]?.data;
  });
  return byCode;
}
