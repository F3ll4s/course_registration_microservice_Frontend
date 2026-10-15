import { TriangleAlert } from "lucide-react";
import type { SectionRow } from "@/api/types";
import { sectionName } from "@/lib/portal";
import { toMin } from "@/lib/time";
import { cn } from "@/lib/utils";
import { GRID_END, GRID_START, HOUR_PX } from "./grid";

export type BlockTone = "enrolled" | "staged" | "clash";

// Penpot "Design #1" > Component Library > Timetable Schedule Blocks, Variant A (in-grid cells)
const TONES: Record<BlockTone, { box: string; title: string; text: string; label: string }> = {
  enrolled: {
    box: "border border-[#3b82f6] bg-[#eff6ff]",
    title: "text-[#1d4ed8]",
    text: "text-[#2563eb]",
    label: "Enrolled",
  },
  staged: {
    box: "border border-dashed border-[#8b5cf6] bg-[#f5f3ff]",
    title: "text-[#6d28d9]",
    text: "text-[#7c3aed]",
    label: "Staged",
  },
  clash: {
    box: "border border-[#dc2626] bg-[#fef2f2]",
    title: "text-[#dc2626]",
    text: "text-[#991b1b]",
    label: "Clash",
  },
};

// One class meeting inside a day column. The column is `relative`; the block is placed by its start and end time.
// A clash block names the section it collides with (`against`).
export function TimetableBlock({ row, tone, against }: { row: SectionRow; tone: BlockTone; against?: SectionRow }) {
  const { section } = row;
  const start = Math.max(GRID_START, toMin(section.start_time));
  const end = Math.min(GRID_END, toMin(section.end_time));
  // 2px gap above and below, so back-to-back classes stay visually separate
  const top = ((start - GRID_START) / 60) * HOUR_PX + 2;
  const height = ((end - start) / 60) * HOUR_PX - 4;
  const t = TONES[tone];
  const time = `${section.start_time} - ${section.end_time}`;

  return (
    <div
      aria-label={`${sectionName(section)}, ${t.label.toLowerCase()}, ${time}`}
      className={cn("absolute inset-x-0 z-10 flex flex-col gap-0.5 overflow-hidden rounded-md px-1 py-1", t.box)}
      style={{ top, height }}
    >
      {tone === "clash" ? (
        <>
          <div className={cn("flex items-center gap-1 text-[11px] leading-[14px] font-bold", t.title)}>
            <TriangleAlert aria-hidden className="size-3 shrink-0 text-[#f59e0b]" />
            CLASH!
          </div>
          <div className={cn("truncate text-[10px] leading-3 font-medium", t.text)}>
            {section.course_code} vs {against?.section.course_code}
          </div>
        </>
      ) : (
        <>
          <div className={cn("truncate text-[11px] leading-[14px] font-bold", t.title)}>{sectionName(section)}</div>
          <div className={cn("truncate text-[10px] leading-3 font-medium", t.text)}>
            {section.room} ({t.label})
          </div>
        </>
      )}
      <div className={cn("truncate text-[9px] leading-[11px] font-semibold", t.text)}>{time}</div>
    </div>
  );
}
