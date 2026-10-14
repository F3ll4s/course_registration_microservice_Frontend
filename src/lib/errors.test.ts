import { describe, expect, it } from "vitest";
import { ApiError } from "@/api/client";
import { toUserMessage } from "./errors";

describe("toUserMessage", () => {
  it("explains rate limiting", () => {
    expect(toUserMessage(new ApiError(429, null))).toBe(
      "Too many requests. Please wait a moment and try again.",
    );
  });

  it("explains an expired session", () => {
    expect(toUserMessage(new ApiError(401, null))).toBe("Your session has expired. Please log in again.");
  });

  it("shows the backend's detail message", () => {
    expect(toUserMessage(new ApiError(400, { detail: "Section is closed." }))).toBe("Section is closed.");
  });

  it("falls back to a generic message", () => {
    expect(toUserMessage(new ApiError(500, { detail: { code: 1 } }))).toBe(
      "Something went wrong. Please try again.",
    );
    expect(toUserMessage(new Error("network down"))).toBe("Something went wrong. Please try again.");
  });
});
