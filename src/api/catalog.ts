import { api } from "./client";
import type { Course, Day, Section } from "./types";

function qs(params: Record<string, string | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== false) sp.set(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// The gateway forwards these to the Catalog Service (query filters pass through)
export const getCourses = (f: { search?: string; department?: string } = {}) =>
  api<Course[]>(`/courses${qs(f)}`);

export const getSections = (f: { course_code?: string; day?: Day; open_only?: boolean } = {}) =>
  api<Section[]>(`/sections${qs(f)}`);
