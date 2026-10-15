import { z } from "zod";

// Checked in the browser before the login request is sent.
// KMITL student IDs are 8 digits, e.g. 65010042.
export const loginSchema = z.object({
  studentId: z
    .string()
    .trim()
    // abort: an empty ID gets only this message, not "must be 8 digits" as well
    .min(1, { message: "Enter your student ID.", abort: true })
    .regex(/^\d{8}$/, "Student ID must be 8 digits."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginValues = z.infer<typeof loginSchema>;
