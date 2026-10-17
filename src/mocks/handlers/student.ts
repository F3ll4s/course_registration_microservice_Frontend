import { jwtDecode } from "jwt-decode";
import { http, HttpResponse } from "msw";
import type { Student } from "@/api/types";

// GET /api/v1/students/me: the gateway reads the id from the JWT, so the mock does too
export const studentHandlers = [
  http.get("*/api/v1/students/me", ({ request }) => {
    const token = request.headers.get("Authorization")?.replace(/^Bearer /, "");
    const id = token ? jwtDecode<{ sub: string }>(token).sub : "STU_001";
    const student: Student = {
      id,
      name: id === "STU_001" ? "Alice Smith" : "Mock Student",
      completed_courses: ["CS101", "CS102", "CS201", "CS202"],
      enrolled_credits: 0,
      max_credits: 22,
    };
    return HttpResponse.json(student);
  }),
];
