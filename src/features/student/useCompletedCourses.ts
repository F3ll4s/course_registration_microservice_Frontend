import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "@/api/students";
import { useAuthStore } from "@/features/auth/store";

// Completed course codes for the logged-in student; the prerequisite check needs them
export function useCompletedCourses() {
  const studentId = useAuthStore((s) => s.studentId);
  return useQuery({
    queryKey: ["student", studentId],
    queryFn: getMyProfile,
    enabled: !!studentId,
    select: (student) => student.completed_courses,
  });
}
