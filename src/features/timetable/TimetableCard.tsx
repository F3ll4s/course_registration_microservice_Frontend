import { CalendarDays } from "lucide-react";
import type { Day, SectionRow } from "@/api/types";
import { sectionsOverlap } from "@/features/cart/rules";
import { useCartRows } from "@/features/cart/useCartRows";
import { useEnrolledRows } from "@/features/enrollment/useMyEnrollments";
import { toUserMessage } from "@/lib/errors";
import { CARD } from "@/lib/portal";
import { cn } from "@/lib/utils";
import { GRID_END, GRID_HEIGHT, GRID_START, HOUR_PX } from "./grid";
import { type BlockTone, TimetableBlock } from "./TimetableBlock";

const DAYS: { value: Day; label: string }[] = [
  { value: "MON", label: "Mon" },
  { value: "TUE", label: "Tue" },
  { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" },
  { value: "FRI", label: "Fri" },
];

// 8, 9 ... 17: one row per hour
const HOURS = Array.from({ length: (GRID_END - GRID_START) / 60 }, (_, i) => GRID_START / 60 + i);

const COLUMNS = "grid grid-cols-[56px_repeat(5,minmax(0,1fr))] gap-x-1";

const LEGEND = "inline-flex h-5 items-center gap-1 rounded border px-2 text-[10px] font-bold whitespace-nowrap";

type Block = { row: SectionRow; tone: BlockTone; against?: SectionRow };

// Penpot "Design #1" > Desktop - Registration Portal > Weekly Timetable Card
export function TimetableCard() {
  const { rows: enrolled, isLoading, error } = useEnrolledRows();
  const enrolledIds = new Set(enrolled.map((r) => r.section.id));
  const staged = useCartRows().filter((r) => !enrolledIds.has(r.section.id));

  // A staged section clashes when it overlaps anything else on the grid
  const all = [...enrolled, ...staged];
  const blocks: Block[] = [
    ...enrolled.map((row) => ({ row, tone: "enrolled" as const })),
    ...staged.map((row) => {
      const against = all.find((o) => o.section.id !== row.section.id && sectionsOverlap(row.section, o.section));
      return { row, tone: against ? ("clash" as const) : ("staged" as const), against };
    }),
  ];
  const count = (tone: BlockTone) => blocks.filter((b) => b.tone === tone).length;

  return (
    <section aria-label="Weekly timetable" className={cn(CARD, "p-4")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[13px] font-bold text-[#0f172a]">WEEKLY TIMETABLE</h2>
        <div className="flex flex-wrap gap-1.5">
          <span className={cn(LEGEND, "border-[#3b82f6] bg-[#eff6ff] text-[#1d4ed8]")}>■ Enrolled ({count("enrolled")})</span>
          <span className={cn(LEGEND, "border-[#8b5cf6] bg-[#f5f3ff] text-[#6d28d9]")}>■ Staged ({count("staged")})</span>
          <span className={cn(LEGEND, "border-[#dc2626] bg-[#fef2f2] text-[#991b1b]")}>■ Conflict ({count("clash")})</span>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-[#fecaca] bg-[#fef2f2] p-3 text-xs font-semibold text-[#991b1b]">
          Couldn't load your timetable: {toUserMessage(error)}
        </p>
      ) : (
        <div className="mt-2.5 overflow-x-auto">
          <div className="min-w-[440px]">
            <div className={COLUMNS}>
              <span className="flex h-5 items-center text-[11px] font-bold text-[#94a3b8]">Time</span>
              {DAYS.map((d) => (
                <span
                  key={d.value}
                  className="flex h-5 items-center justify-center rounded bg-[#f8fafc] text-[11px] font-bold text-[#475569]"
                >
                  {d.label}
                </span>
              ))}
            </div>

            <div className={cn(COLUMNS, "mt-2.5")} style={{ height: GRID_HEIGHT }}>
              <div className="relative">
                {HOURS.map((hour, i) => (
                  <span
                    key={hour}
                    className="absolute left-0 text-[10px] leading-3 font-semibold text-[#64748b]"
                    style={{ top: i * HOUR_PX + 4 }}
                  >
                    {String(hour).padStart(2, "0")}:00
                  </span>
                ))}
              </div>

              {DAYS.map((day) => (
                <div key={day.value} className="relative">
                  {/* One faint cell per hour, as the empty slots on the board */}
                  {HOURS.map((hour, i) => (
                    <div
                      key={hour}
                      aria-hidden
                      className="absolute inset-x-0 rounded border border-[#e2e8f0] bg-[#f8fafc]/70"
                      style={{ top: i * HOUR_PX + 2, height: HOUR_PX - 4 }}
                    />
                  ))}
                  {blocks
                    .filter(({ row }) => row.section.schedule_days.includes(day.value))
                    .map((b) => (
                      <TimetableBlock key={`${b.tone}-${b.row.section.id}`} {...b} />
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && blocks.length === 0 && (
        <div className="mt-3 flex flex-col items-center gap-1 rounded-md border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-3 text-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#475569]">
            <CalendarDays aria-hidden className="size-3.5" />
            No Classes Scheduled Yet
          </div>
          <p className="text-[11px] text-[#94a3b8]">
            Staged courses from the catalog will appear on the calendar above in purple dashed lines.
          </p>
        </div>
      )}
    </section>
  );
}
