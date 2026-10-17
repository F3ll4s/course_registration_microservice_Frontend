import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { logIn } from "@/test/render";
import { ApiError } from "./client";
import { claimWaitlist, drop, enroll, getMyEnrollments, getMyWaitlist } from "./enrollments";
import { getMyProfile } from "./students";

// These run against the MSW mocks in src/mocks; the mock data is reset after every test (src/test/setup.ts).

const enrolledIds = async () => (await getMyEnrollments()).map((e) => e.section_id);

describe("enroll", () => {
  it("returns ENROLLED for an open section", async () => {
    expect((await enroll(101)).status).toBe("ENROLLED");
  });

  it("converts 409 WAITLISTED into a normal result", async () => {
    expect((await enroll(102)).status).toBe("WAITLISTED");
  });

  it("converts 400 REJECTED into a normal result with the backend's message", async () => {
    server.use(
      http.post("*/api/v1/enrollments", () =>
        HttpResponse.json(
          { status: "REJECTED", message: "Credit limit exceeded.", rule_name: "CreditLimitRule" },
          { status: 400 },
        ),
      ),
    );
    expect(await enroll(101)).toMatchObject({ status: "REJECTED", message: "Credit limit exceeded." });
  });

  it("still throws for a duplicate request (409 without a WAITLISTED body)", async () => {
    await enroll(101);
    await expect(enroll(101)).rejects.toBeInstanceOf(ApiError);
  });
});

describe("my enrollments", () => {
  it("includes a section after enrolling and drops it again", async () => {
    await enroll(107);
    expect(await enrolledIds()).toContain(107);

    await drop(107);
    expect(await enrolledIds()).not.toContain(107);
  });
});

describe("my waitlist", () => {
  it("lists an entry with a queue position after joining a full section", async () => {
    await enroll(102);
    const entry = (await getMyWaitlist()).find((w) => w.section_id === 102);
    expect(entry).toMatchObject({ section_id: 102, course_code: "CS301", status: "WAITLISTED" });
    expect(entry?.position).toBeGreaterThan(0);
  });

  it("removes the entry when the student leaves the waitlist", async () => {
    await enroll(102);
    await drop(102);
    expect((await getMyWaitlist()).some((w) => w.section_id === 102)).toBe(false);
  });

  it("reports an offer that can't be claimed instead of throwing", async () => {
    expect((await claimWaitlist(9999)).status).toBe("EXPIRED_OR_ALREADY_CLAIMED");
  });
});

describe("getMyProfile", () => {
  it("returns the logged-in student's completed courses", async () => {
    logIn("STU_001");
    const student = await getMyProfile();
    expect(student.id).toBe("STU_001");
    expect(student.completed_courses).toEqual(expect.arrayContaining(["CS101"]));
  });
});
