import { describe, expect, it } from "vitest";
import type { Section } from "@/api/types";
import { isFull } from "@/features/catalog/seats";
import { formatDays, formatSchedule } from "./portal";

const section = (overrides: Partial<Section> = {}): Section => ({
  id: 1,
  course_code: "CS301",
  section_number: 1,
  capacity: 50,
  enrolled_count: 48,
  schedule_days: ["MON", "WED"],
  start_time: "09:00",
  end_time: "10:30",
  room: "HM402",
  instructor: "Dr. Veera B.",
  ...overrides,
});

describe("formatDays", () => {
  it("turns day codes into short names", () => {
    expect(formatDays(["MON", "WED"])).toBe("Mon, Wed");
    expect(formatDays(["FRI"])).toBe("Fri");
  });
});

describe("formatSchedule", () => {
  it("joins days and the time range", () => {
    expect(formatSchedule(section())).toBe("Mon, Wed 09:00 - 10:30");
  });
});

describe("isFull", () => {
  it("is false while seats remain", () => {
    expect(isFull(section({ enrolled_count: 49 }))).toBe(false);
  });

  it("is true at capacity and above", () => {
    expect(isFull(section({ enrolled_count: 50 }))).toBe(true);
    expect(isFull(section({ enrolled_count: 51 }))).toBe(true);
  });
});
