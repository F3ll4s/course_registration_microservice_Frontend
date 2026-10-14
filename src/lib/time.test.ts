import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseServerTime, toMin, useCountdown } from "./time";

describe("toMin", () => {
  it("converts HH:MM to minutes since midnight", () => {
    expect(toMin("00:00")).toBe(0);
    expect(toMin("09:30")).toBe(570);
    expect(toMin("18:00")).toBe(1080);
  });
});

describe("parseServerTime", () => {
  it("treats a timestamp without a timezone as UTC (SQLite CURRENT_TIMESTAMP)", () => {
    expect(parseServerTime("2026-10-08 10:00:00").toISOString()).toBe("2026-10-08T10:00:00.000Z");
  });

  it("keeps an explicit Z", () => {
    expect(parseServerTime("2026-10-08T10:00:00Z").toISOString()).toBe("2026-10-08T10:00:00.000Z");
  });

  it("respects an explicit offset", () => {
    expect(parseServerTime("2026-10-08T10:00:00+07:00").toISOString()).toBe("2026-10-08T03:00:00.000Z");
  });
});

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-08T10:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("counts down once per second", () => {
    const { result } = renderHook(() => useCountdown("2026-10-08 10:00:05"));
    expect(result.current).toBe(5);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current).toBe(3);
  });

  it("stops at zero instead of going negative", () => {
    const { result } = renderHook(() => useCountdown("2026-10-08 10:00:01"));
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toBe(0);
  });

  it("is zero for an offer that already expired", () => {
    const { result } = renderHook(() => useCountdown("2026-10-08 09:00:00"));
    expect(result.current).toBe(0);
  });
});
