import { describe, expect, it } from "vitest";
import { loginSchema } from "./loginSchema";

const errorsFor = (values: { studentId: string; password: string }) => {
  const result = loginSchema.safeParse(values);
  return result.success ? {} : result.error.flatten().fieldErrors;
};

describe("loginSchema", () => {
  it("accepts a backend student ID and any password", () => {
    expect(loginSchema.safeParse({ studentId: "STU_001", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ studentId: "stu_001", password: "x" }).success).toBe(true);
  });

  it("ignores spaces around the student ID", () => {
    expect(loginSchema.parse({ studentId: " STU_001 ", password: "x" }).studentId).toBe("STU_001");
  });

  it("asks for both fields when they are empty", () => {
    expect(errorsFor({ studentId: "", password: "" })).toEqual({
      studentId: ["Enter your student ID."],
      password: ["Enter your password."],
    });
  });

  it("rejects IDs with spaces or symbols", () => {
    for (const studentId of ["STU 001", "STU-001", "stu@001"]) {
      expect(errorsFor({ studentId, password: "x" }).studentId).toEqual([
        "Student ID can only contain letters, numbers and _.",
      ]);
    }
  });
});
