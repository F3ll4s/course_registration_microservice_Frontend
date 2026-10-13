import { api } from "./client";
import type { Student } from "./types";

// Assumed path (README section 5, request 1): not confirmed by the backend team yet
export const getStudent = (studentId: string) => api<Student>(`/students/${studentId}`);
