import { describe, expect, it } from "vitest";
import { claimWaitlist, drop, enroll, getMyEnrollments, getMyWaitlist } from "./enrollments";
import { getStudent } from "./students";

// These run against the MSW mocks in src/mocks, which keep state for the whole file.
// Each test uses different section ids so the order of the tests doesn't matter.

const enrolledIds = async () => (await getMyEnrollments()).map((e) => e.section_id);

describe("enroll", () => {
  it("returns ENROLLED for an open section", async () => {
    expect((await enroll(101)).status).toBe("ENROLLED");
  });

  it("converts 409 WAITLISTED into a normal result", async () => {
    expect((await enroll(102)).status).toBe("WAITLISTED");
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
    await enroll(104);
    const entry = (await getMyWaitlist()).find((w) => w.section_id === 104);
    expect(entry).toMatchObject({ section_id: 104, status: "WAITLISTED" });
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

describe("getStudent", () => {
  it("returns the completed courses that validate-prereqs needs", async () => {
    const student = await getStudent("65010042");
    expect(student.student_id).toBe("65010042");
    expect(student.completed_courses).toEqual(expect.arrayContaining(["CS101"]));
  });
});
