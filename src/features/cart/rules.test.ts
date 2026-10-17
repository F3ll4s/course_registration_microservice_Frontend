import { describe, expect, it } from "vitest";
import type { Day, PrereqResult, SectionRow } from "@/api/types";
import {
  canConfirm,
  type CartContext,
  checkPrereqs,
  creditCapRule,
  MAX_CREDITS,
  prereqRule,
  runRules,
  scheduleConflictRule,
  sectionsOverlap,
} from "./rules";

let nextId = 1;

// A section row with sensible defaults; override only what the test is about
function row(
  code: string,
  { days = ["MON"], start = "09:00", end = "10:30", credits = 3 }: {
    days?: Day[];
    start?: string;
    end?: string;
    credits?: number;
  } = {},
): SectionRow {
  const id = nextId++;
  return {
    section: {
      id,
      course_code: code,
      section_number: 1,
      capacity: 40,
      enrolled_count: 0,
      schedule_days: days,
      start_time: start,
      end_time: end,
      room: "HM101",
      instructor: "Dr. Test",
    },
    course: { code, title: `${code} title`, credits, prerequisites: [] },
  };
}

const met: PrereqResult = { is_valid: true, missing_prereqs: [], message: "All prerequisites satisfied." };
const missing = (...codes: string[]): PrereqResult => ({
  is_valid: false,
  missing_prereqs: codes,
  message: `Missing required prerequisite(s): ${codes.join(", ")}`,
});

const ctx = (partial: Partial<CartContext>): CartContext => ({ cart: [], enrolled: [], prereqs: {}, ...partial });

describe("sectionsOverlap", () => {
  it("is true for overlapping times on a shared day", () => {
    const a = row("A", { days: ["MON", "WED"], start: "09:00", end: "10:30" });
    const b = row("B", { days: ["WED"], start: "10:00", end: "11:30" });
    expect(sectionsOverlap(a.section, b.section)).toBe(true);
  });

  it("is true when one class sits inside the other", () => {
    const a = row("A", { start: "09:00", end: "12:00" });
    const b = row("B", { start: "10:00", end: "11:00" });
    expect(sectionsOverlap(a.section, b.section)).toBe(true);
  });

  it("is false for back-to-back classes, in either order", () => {
    const a = row("A", { start: "09:00", end: "10:30" });
    const b = row("B", { start: "10:30", end: "12:00" });
    expect(sectionsOverlap(a.section, b.section)).toBe(false);
    expect(sectionsOverlap(b.section, a.section)).toBe(false);
  });

  it("is false for the same time on different days", () => {
    const a = row("A", { days: ["MON"] });
    const b = row("B", { days: ["TUE"] });
    expect(sectionsOverlap(a.section, b.section)).toBe(false);
  });
});

describe("creditCapRule", () => {
  it("counts enrolled and cart credits together", () => {
    const result = creditCapRule(ctx({ enrolled: [row("A"), row("B")], cart: [row("C")] }));
    expect(result).toEqual({ rule: "credits", ok: true, message: `9 / ${MAX_CREDITS} Credits` });
  });

  it("allows exactly the cap", () => {
    const result = creditCapRule(ctx({ enrolled: [row("A", { credits: 19 })], cart: [row("B")] }));
    expect(result.ok).toBe(true);
    expect(result.message).toBe("22 / 22 Credits");
  });

  it("fails one credit over the cap", () => {
    const result = creditCapRule(ctx({ enrolled: [row("A", { credits: 20 })], cart: [row("B")] }));
    expect(result.ok).toBe(false);
    expect(result.message).toBe("23 / 22 Credits");
  });
});

describe("scheduleConflictRule", () => {
  it("passes when nothing overlaps", () => {
    const result = scheduleConflictRule(
      ctx({ enrolled: [row("A", { days: ["MON"] })], cart: [row("B", { days: ["TUE"] })] }),
    );
    expect(result).toEqual({ rule: "schedule", ok: true, message: "Clashes: NONE" });
  });

  it("fails when a cart section overlaps an enrolled one, naming both", () => {
    const enrolled = row("CS202", { start: "09:00", end: "10:30" });
    const cart = row("CS301", { start: "10:00", end: "11:30" });
    const result = scheduleConflictRule(ctx({ enrolled: [enrolled], cart: [cart] }));
    expect(result.ok).toBe(false);
    expect(result.message).toBe("Conflict: CS301 Sec 1 overlaps with CS202 Sec 1");
  });

  it("fails when two cart sections overlap each other", () => {
    const result = scheduleConflictRule(ctx({ cart: [row("A"), row("B")] }));
    expect(result.ok).toBe(false);
  });

  it("ignores clashes between already-enrolled sections", () => {
    const result = scheduleConflictRule(ctx({ enrolled: [row("A"), row("B")], cart: [] }));
    expect(result.ok).toBe(true);
  });
});

describe("prereqRule", () => {
  it("is not ok while a result is still loading", () => {
    const result = prereqRule(ctx({ cart: [row("A")], prereqs: {} }));
    expect(result).toEqual({ rule: "prereqs", ok: false, message: "Checking prerequisites..." });
  });

  it("passes when every cart course is valid", () => {
    const result = prereqRule(ctx({ cart: [row("A"), row("B")], prereqs: { A: met, B: met } }));
    expect(result).toEqual({ rule: "prereqs", ok: true, message: "Prereqs: MET" });
  });

  it("lists each missing prerequisite once", () => {
    const result = prereqRule(
      ctx({
        cart: [row("A"), row("B")],
        prereqs: { A: missing("CS102", "CS202"), B: missing("CS202") },
      }),
    );
    expect(result).toEqual({ rule: "prereqs", ok: false, message: "Prereqs: MISSING CS102, CS202" });
  });
});

describe("runRules and canConfirm", () => {
  it("runs the three default rules in order", () => {
    const results = runRules(ctx({ cart: [row("A")], prereqs: { A: met } }));
    expect(results.map((r) => r.rule)).toEqual(["credits", "schedule", "prereqs"]);
  });

  it("allows confirming a valid cart", () => {
    expect(canConfirm(ctx({ cart: [row("A")], prereqs: { A: met } }))).toBe(true);
  });

  it("blocks an empty cart even though every rule passes", () => {
    expect(canConfirm(ctx({ cart: [] }))).toBe(false);
  });

  it("blocks when any single rule fails", () => {
    const over = ctx({ enrolled: [row("A", { credits: 21, days: ["FRI"] })], cart: [row("B")], prereqs: { B: met } });
    const clash = ctx({ cart: [row("A"), row("B")], prereqs: { A: met, B: met } });
    const prereq = ctx({ cart: [row("A")], prereqs: { A: missing("CS101") } });
    expect(canConfirm(over)).toBe(false);
    expect(canConfirm(clash)).toBe(false);
    expect(canConfirm(prereq)).toBe(false);
  });
});

describe("checkPrereqs", () => {
  const withPrereqs = (code: string, prerequisites: string[]) => {
    const r = row(code);
    return { ...r, course: { ...r.course, prerequisites } };
  };

  it("lists the prerequisites the student has not completed", () => {
    const result = checkPrereqs([withPrereqs("CS301", ["CS102", "CS202"])], ["CS102"]);
    expect(result.CS301).toMatchObject({ is_valid: false, missing_prereqs: ["CS202"] });
  });

  it("passes a course whose prerequisites are all completed, or that has none", () => {
    const result = checkPrereqs([withPrereqs("CS301", ["CS102"]), withPrereqs("CS101", [])], ["CS102"]);
    expect(result.CS301?.is_valid).toBe(true);
    expect(result.CS101?.is_valid).toBe(true);
  });

  it("returns nothing while the completed courses are still loading", () => {
    expect(checkPrereqs([withPrereqs("CS301", ["CS102"])], undefined)).toEqual({});
  });
});
