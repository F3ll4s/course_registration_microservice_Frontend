import { api } from "./client";

export type LoginResponse = { access_token: string; token_type: string };

export const login = (studentId: string, password: string) =>
  api<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ student_id: studentId, password }),
  });
