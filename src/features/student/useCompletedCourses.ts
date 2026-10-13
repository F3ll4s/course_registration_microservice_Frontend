import { useQuery } from "@tanstack/react-query";
import { getStudent } from "@/api/students";
import { useAuthStore } from "@/features/auth/store";

// Completed course codes for the logged-in student; validate-prereqs needs them in its body
export function useCompletedCourses() {
  const studentId = useAuthStore((s) => s.studentId);
  return useQuery({
    queryKey: ["student", studentId],
    queryFn: () => getStudent(studentId as string),
    enabled: !!studentId,
    select: (student) => student.completed_courses,
  });
}
