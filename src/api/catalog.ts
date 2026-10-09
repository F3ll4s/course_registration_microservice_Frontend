import { catalogApi } from "./client";
import type { Course, Day, PrereqRequest, PrereqResult, Section } from "./types";

function qs(params: Record<string, string | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== false) sp.set(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const getCourses = (f: { search?: string; department?: string } = {}) =>
  catalogApi<Course[]>(`/courses${qs(f)}`);

export const getSections = (f: { course_code?: string; day?: Day; open_only?: boolean } = {}) =>
  catalogApi<Section[]>(`/sections${qs(f)}`);

export const validatePrereqs = (body: PrereqRequest) =>
  catalogApi<PrereqResult>("/validate-prereqs", { method: "POST", body: JSON.stringify(body) });
