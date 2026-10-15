import { describe, expect, it } from "vitest";
import { loginSchema } from "./loginSchema";

const errorsFor = (values: { studentId: string; password: string }) => {
  const result = loginSchema.safeParse(values);
  return result.success ? {} : result.error.flatten().fieldErrors;
};

describe("loginSchema", () => {
  it("accepts an 8-digit student ID and any password", () => {
    expect(loginSchema.safeParse({ studentId: "65010042", password: "x" }).success).toBe(true);
  });

  it("ignores spaces around the student ID", () => {
    expect(loginSchema.parse({ studentId: " 65010042 ", password: "x" }).studentId).toBe("65010042");
  });

  it("asks for both fields when they are empty", () => {
    expect(errorsFor({ studentId: "", password: "" })).toEqual({
      studentId: ["Enter your student ID."],
      password: ["Enter your password."],
    });
  });

  it("rejects IDs that are not exactly 8 digits", () => {
    for (const studentId of ["6501004", "650100421", "6501OO42", "abc"]) {
      expect(errorsFor({ studentId, password: "x" }).studentId).toEqual(["Student ID must be 8 digits."]);
    }
  });
});
