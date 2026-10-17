import { z } from "zod";

// Checked in the browser before the login request is sent.
// Student IDs look like STU_001; the backend ignores letter case.
export const loginSchema = z.object({
  studentId: z
    .string()
    .trim()
    // abort: an empty ID gets only this message, not the format message as well
    .min(1, { message: "Enter your student ID.", abort: true })
    .regex(/^[A-Za-z0-9_]+$/, "Student ID can only contain letters, numbers and _."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginValues = z.infer<typeof loginSchema>;
