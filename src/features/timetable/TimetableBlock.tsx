import type { Section } from "@/api/types";
import { toMin } from "@/lib/time";
import { cn } from "@/lib/utils";

const GRID_START = 8 * 60; // 08:00
const GRID_SPAN = 10 * 60; // 08:00 to 18:00

export function TimetableBlock({ section, tone }: { section: Section; tone: "enrolled" | "staged" }) {
  const top = ((toMin(section.start_time) - GRID_START) / GRID_SPAN) * 100;
  const height = ((toMin(section.end_time) - toMin(section.start_time)) / GRID_SPAN) * 100;

  return (
    <div
      className={cn(
        "absolute inset-x-1 overflow-hidden rounded-md p-1 text-xs",
        tone === "enrolled" ? "bg-blue-100 text-blue-900" : "bg-amber-100 text-amber-900",
      )}
      style={{ top: `${top}%`, height: `${height}%` }}
    >
      <div className="font-medium">
        {section.course_code} Sec {section.section_number}
      </div>
      <div>
        {section.start_time}-{section.end_time} · {section.room}
      </div>
    </div>
  );
}
