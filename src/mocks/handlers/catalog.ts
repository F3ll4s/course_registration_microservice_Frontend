import { http, HttpResponse } from "msw";
import type { Course, Section } from "@/api/types";

const courses: Course[] = [
  { code: "CS101", title: "Programming Fundamentals", credits: 3, prerequisites: [] },
  { code: "CS102", title: "Data Structures", credits: 3, prerequisites: ["CS101"] },
  {
    code: "CS301",
    title: "Software Design & Architecture",
    credits: 3,
    prerequisites: ["CS102", "CS202"],
  },
];

const sections: Section[] = [
  {
    id: 101, course_code: "CS301", section_number: 1, capacity: 10, enrolled_count: 0,
    schedule_days: ["MON", "WED"], start_time: "09:00", end_time: "10:30",
    room: "HM402", instructor: "Dr. Veera B.",
  },
  {
    id: 102, course_code: "CS301", section_number: 2, capacity: 10, enrolled_count: 10, // full
    schedule_days: ["TUE", "THU"], start_time: "13:00", end_time: "14:30",
    room: "HM403", instructor: "Dr. Veera B.",
  },
  {
    id: 103, course_code: "CS102", section_number: 1, capacity: 40, enrolled_count: 12,
    schedule_days: ["MON", "WED"], start_time: "10:00", end_time: "11:30",
    room: "HM201", instructor: "Dr. Somchai K.",
  },
];

export const catalogHandlers = [
  http.get("*/catalog/courses", ({ request }) => {
    const q = new URL(request.url).searchParams.get("search")?.toLowerCase();
    return HttpResponse.json(
      courses.filter(
        (c) => !q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q),
      ),
    );
  }),

  http.get("*/catalog/sections", ({ request }) => {
    const p = new URL(request.url).searchParams;
    const code = p.get("course_code");
    const day = p.get("day");
    const openOnly = p.get("open_only") === "true";
    return HttpResponse.json(
      sections.filter(
        (s) =>
          (!code || s.course_code === code) &&
          (!day || s.schedule_days.some((d) => d === day)) &&
          (!openOnly || s.enrolled_count < s.capacity),
      ),
    );
  }),

  http.post("*/catalog/validate-prereqs", async ({ request }) => {
    const { course_code, completed_courses } = (await request.json()) as {
      student_id: string;
      course_code: string;
      completed_courses: string[];
    };
    const required = courses.find((c) => c.code === course_code)?.prerequisites ?? [];
    const missing = required.filter((c) => !completed_courses.includes(c));
    return HttpResponse.json({
      is_valid: missing.length === 0,
      missing_prereqs: missing,
      message: missing.length
        ? `Missing required prerequisite(s): ${missing.join(", ")}`
        : "All prerequisites satisfied.",
    });
  }),
];
