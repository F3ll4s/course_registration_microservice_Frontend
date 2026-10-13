import { http, HttpResponse } from "msw";

// Assumed path and shape (README section 5, request 1)
export const studentHandlers = [
  http.get("*/api/v1/students/:id", ({ params }) =>
    HttpResponse.json({
      student_id: params.id,
      completed_courses: ["CS101", "CS102", "CS201", "CS202"],
    }),
  ),
];
