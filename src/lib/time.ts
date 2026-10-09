import { useEffect, useState } from "react";

// "09:30" -> 570 (minutes since midnight). Used for schedule overlap and timetable placement.
export const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// SQLite's CURRENT_TIMESTAMP is UTC but has no timezone suffix.
// If the backend sends "2026-10-08 10:00:00", treat it as UTC (Bangkok is UTC+7!).
export function parseServerTime(value: string): Date {
  const hasZone = /Z|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasZone ? value : `${value.replace(" ", "T")}Z`);
}

const secondsLeft = (expiresAt: string) =>
  Math.max(0, Math.floor((parseServerTime(expiresAt).getTime() - Date.now()) / 1000));

export function useCountdown(expiresAt: string): number {
  const [left, setLeft] = useState(() => secondsLeft(expiresAt));
  useEffect(() => {
    const id = setInterval(() => setLeft(secondsLeft(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return left;
}
