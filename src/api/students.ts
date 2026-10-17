import { api } from "./client";
import type { Student } from "./types";

// The logged-in student's profile; the gateway takes the id from the JWT
export const getMyProfile = () => api<Student>("/students/me");
