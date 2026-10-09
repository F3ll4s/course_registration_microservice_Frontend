import { describe, expect, it } from "vitest";
import { enroll } from "./enrollments";

describe("enroll", () => {
  it("returns ENROLLED for an open section", async () => {
    expect((await enroll(101)).status).toBe("ENROLLED");
  });

  it("converts 409 WAITLISTED into a normal result", async () => {
    expect((await enroll(102)).status).toBe("WAITLISTED");
  });
});
