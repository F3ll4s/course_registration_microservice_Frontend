import type { SectionRow } from "@/api/types";
import { toMin } from "@/lib/time";
import { cn } from "@/lib/utils";
import { GRID_END, GRID_LEAD, GRID_START, HOUR_PX } from "./grid";

export type BlockTone = "enrolled" | "staged" | "clash";

const TONES: Record<BlockTone, { box: string; title: string; name: string; time: string; label: string }> = {
  enrolled: {
    box: "bg-[#ff6b00]",
    title: "text-white",
    name: "text-white",
    time: "text-[#ffe8d6]",
    label: "ENROLLED",
  },
  staged: {
    box: "border-2 border-[#ea580c] bg-[#fff7ed]",
    title: "text-[#9a3412]",
    name: "text-[#c2410c]",
    time: "text-[#ea580c]",
    label: "IN CART",
  },
  clash: {
    box: "border-2 border-[#dc2626] bg-[#fef2f2]",
    title: "text-[#991b1b]",
    name: "text-[#991b1b]",
    time: "text-[#b91c1c]",
    label: "CLASH",
  },
};

// One class meeting inside a day column. The column is `relative`; the block is placed by its start and end time.
export function TimetableBlock({ row, tone }: { row: SectionRow; tone: BlockTone }) {
  const { section, course } = row;
  const start = Math.max(GRID_START, toMin(section.start_time));
  const end = Math.min(GRID_END, toMin(section.end_time));
  // 2px gap above and below, so back-to-back classes stay visually separate
  const top = GRID_LEAD + ((start - GRID_START) / 60) * HOUR_PX + 2;
  const height = ((end - start) / 60) * HOUR_PX - 4;
  const t = TONES[tone];

  return (
    <div
      className={cn("absolute inset-x-1 flex flex-col overflow-hidden rounded-md px-2 pt-2", t.box)}
      style={{ top, height }}
    >
      <div className={cn("truncate text-[11px] leading-[14px] font-bold", t.title)}>
        {section.course_code} Sec {section.section_number} [{t.label}]
      </div>
      <div className={cn("mt-1 truncate text-[11px] leading-[14px] font-medium", t.name)}>{course.title}</div>
      <div className={cn("mt-1.5 truncate text-[10px] leading-3 font-semibold", t.time)}>
        {section.start_time} - {section.end_time} | {section.room}
      </div>
    </div>
  );
}
