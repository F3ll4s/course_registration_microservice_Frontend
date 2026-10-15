import type { Day, Section } from "@/api/types";

// Shared class strings for the portal screens. Values come from the Penpot "Design #1" boards
// (Component Library & UI Kit > Button Matrix: default, hover, pressed, disabled).

export const BRAND = "#ff5722";

export const BUTTON =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md text-xs font-bold whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#ff5722]/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:border disabled:border-[#e2e8f0] disabled:bg-[#f1f5f9] disabled:text-[#94a3b8] [&_svg]:size-3.5 [&_svg]:shrink-0";
export const BUTTON_PRIMARY = "bg-[#ff5722] text-white hover:bg-[#e64a19] active:bg-[#d84315]";
export const BUTTON_SECONDARY =
  "border border-[#cbd5e1] bg-white font-semibold text-[#0f172a] hover:bg-[#f1f5f9] active:bg-[#e2e8f0]";
export const BUTTON_DANGER =
  "border border-[#fecaca] bg-white font-semibold text-[#ef4444] hover:border-[#ef4444] hover:bg-[#ef4444] hover:text-white active:bg-[#dc2626]";
export const BUTTON_WAITLIST = "border border-[#f59e0b] bg-[#fffbeb] text-[#b45309] hover:bg-[#fef3c7]";
export const BUTTON_GHOST = "font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] active:bg-[#e2e8f0]";

export const CARD = "rounded-[10px] border border-[#e2e8f0] bg-white";

// ["MON", "WED"] -> "Mon, Wed"
export const formatDays = (days: Day[]) => days.map((d) => d.charAt(0) + d.slice(1).toLowerCase()).join(", ");

// "Mon, Wed 09:00-10:30"
export const formatSchedule = (s: Section) => `${formatDays(s.schedule_days)} ${s.start_time}-${s.end_time}`;

// 1 -> "01", as section numbers are printed on the Design #1 boards
export const secNo = (n: number) => String(n).padStart(2, "0");

// "CS301 Sec 01"
export const sectionName = (s: Section) => `${s.course_code} Sec ${secNo(s.section_number)}`;
