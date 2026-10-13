import type { Day, Section } from "@/api/types";

// Shared class strings for the portal screens. Values come from the Penpot "Initial Draft" boards.

export const BUTTON =
  "inline-flex h-9 items-center justify-center rounded-md text-xs font-bold whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b00]/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60";
export const BUTTON_PRIMARY = "bg-[#ff6b00] text-white hover:bg-[#ea580c]";
export const BUTTON_SOFT = "border border-[#ff6b00] bg-[#fff7ed] text-[#ea580c] hover:bg-[#ffedd5]";
export const BUTTON_NEUTRAL = "border border-[#cbd5e1] bg-white font-semibold text-[#64748b] hover:bg-[#f8fafc]";
export const BUTTON_DANGER = "border border-[#cbd5e1] bg-white font-semibold text-[#ef4444] hover:bg-[#fef2f2]";

export const CARD = "rounded-[10px] border border-[#e2e8f0] bg-white";
export const TABLE_HEAD =
  "items-center rounded-md border border-[#e2e8f0] bg-[#f1f5f9] text-[10px] font-bold text-[#64748b] uppercase";
export const TABLE_ROW = "items-center border border-[#e2e8f0] bg-white";

// ["MON", "WED"] -> "Mon, Wed"
export const formatDays = (days: Day[]) => days.map((d) => d.charAt(0) + d.slice(1).toLowerCase()).join(", ");

// "Mon, Wed 09:00 - 10:30"
export const formatSchedule = (s: Section) => `${formatDays(s.schedule_days)} ${s.start_time} - ${s.end_time}`;
