import { http, HttpResponse } from "msw";
import type { Course, Section } from "@/api/types";

// Same courses and sections as the Penpot "Initial Draft" boards, so the mock UI can be compared to the design
const courses: Course[] = [
  { code: "CS101", title: "Programming Fundamentals", credits: 3, prerequisites: [] },
  { code: "CS102", title: "Data Structures", credits: 3, prerequisites: ["CS101"] },
  { code: "CS202", title: "Algorithms & Data Structures", credits: 3, prerequisites: ["CS101"] },
  {
    code: "CS301",
    title: "Software Design & Architecture",
    credits: 3,
    prerequisites: ["CS102", "CS202"],
  },
  { code: "CS305", title: "Database Systems & Cloud", credits: 3, prerequisites: ["CS201"] },
  { code: "CS315", title: "Computer Networks Lab", credits: 3, prerequisites: [] },
  {
    code: "CS410",
    title: "Artificial Intelligence & Deep Learning",
    credits: 3,
    prerequisites: ["CS202", "MTH205"],
  },
  { code: "CS420", title: "Advanced Distributed Cloud Systems", credits: 3, prerequisites: ["CS302"] },
  { code: "GEN201", title: "Professional English", credits: 3, prerequisites: [] },
  { code: "MTH205", title: "Probability & Statistics", credits: 3, prerequisites: [] },
];

// Exported so the enrollment mock can check seats and update enrolled_count
export const sections: Section[] = [
  {
    id: 101, course_code: "CS301", section_number: 1, capacity: 50, enrolled_count: 48,
    schedule_days: ["MON", "WED"], start_time: "09:00", end_time: "10:30",
    room: "HM402", instructor: "Dr. Veera B.",
  },
  {
    id: 102, course_code: "CS301", section_number: 2, capacity: 50, enrolled_count: 50, // full
    schedule_days: ["TUE", "THU"], start_time: "13:00", end_time: "14:30",
    room: "HM403", instructor: "Assoc. Prof. Somkiat K.",
  },
  {
    id: 107, course_code: "CS202", section_number: 1, capacity: 45, enrolled_count: 38,
    schedule_days: ["TUE", "THU"], start_time: "09:00", end_time: "10:30",
    room: "HM301", instructor: "Asst. Prof. Natthaporn P.",
  },
  {
    id: 104, course_code: "CS305", section_number: 1, capacity: 40, enrolled_count: 40, // full
    schedule_days: ["FRI"], start_time: "09:00", end_time: "12:00",
    room: "HM505", instructor: "Dr. Chulalongkorn S.",
  },
  {
    id: 105, course_code: "CS410", section_number: 1, capacity: 35, enrolled_count: 22,
    schedule_days: ["MON", "WED"], start_time: "13:30", end_time: "15:00",
    room: "HM405", instructor: "Dr. Kittisak T.",
  },
  {
    id: 106, course_code: "CS420", section_number: 1, capacity: 30, enrolled_count: 15,
    schedule_days: ["THU"], start_time: "15:00", end_time: "18:00",
    room: "HM502", instructor: "Assoc. Prof. Wichai P.",
  },
  {
    id: 103, course_code: "CS102", section_number: 1, capacity: 40, enrolled_count: 12,
    schedule_days: ["MON", "WED"], start_time: "10:00", end_time: "11:30",
    room: "HM201", instructor: "Dr. Somchai K.",
  },
  {
    id: 108, course_code: "CS315", section_number: 1, capacity: 30, enrolled_count: 28,
    schedule_days: ["FRI"], start_time: "09:00", end_time: "12:00",
    room: "HM204", instructor: "Dr. Kittisak T.",
  },
  {
    id: 109, course_code: "GEN201", section_number: 3, capacity: 40, enrolled_count: 30,
    schedule_days: ["TUE", "THU"], start_time: "13:00", end_time: "14:30",
    room: "L102", instructor: "Aj. Sarah Jenkins",
  },
  {
    id: 110, course_code: "MTH205", section_number: 2, capacity: 40, enrolled_count: 25,
    schedule_days: ["MON", "WED"], start_time: "11:00", end_time: "12:30",
    room: "HM102", instructor: "Dr. Paitoon R.",
  },
];

export const catalogHandlers = [
  http.get("*/api/v1/courses", ({ request }) => {
    const q = new URL(request.url).searchParams.get("search")?.toLowerCase();
    return HttpResponse.json(
      courses.filter(
        (c) => !q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q),
      ),
    );
  }),

  http.get("*/api/v1/sections", ({ request }) => {
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
];
