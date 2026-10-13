import type { Day, SectionRow } from "@/api/types";
import { Notice, Pill } from "@/components/portal";
import { sectionsOverlap } from "@/features/cart/rules";
import { useCartRows } from "@/features/cart/useCartRows";
import { useEnrolledRows } from "@/features/enrollment/useMyEnrollments";
import { toUserMessage } from "@/lib/errors";
import { CARD } from "@/lib/portal";
import { cn } from "@/lib/utils";
import { GRID_END, GRID_HEIGHT, GRID_LEAD, GRID_START, HOUR_PX } from "./grid";
import { type BlockTone, TimetableBlock } from "./TimetableBlock";

const DAYS: { value: Day; label: string }[] = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
];

// 8, 9 ... 18
const HOURS = Array.from({ length: (GRID_END - GRID_START) / 60 + 1 }, (_, i) => GRID_START / 60 + i);

const credits = (rows: SectionRow[]) => rows.reduce((sum, r) => sum + r.course.credits, 0);

// View 2: Weekly Timetable Preview (Penpot "Initial Draft" > Screen 2)
export function TimetablePage() {
  const { rows: enrolled, isLoading, error } = useEnrolledRows();
  const enrolledIds = new Set(enrolled.map((r) => r.section.id));
  const staged = useCartRows().filter((r) => !enrolledIds.has(r.section.id));

  // A staged section clashes when it overlaps anything else on the grid
  const all = [...enrolled, ...staged];
  const clashing = new Set(
    staged
      .filter((s) => all.some((o) => o.section.id !== s.section.id && sectionsOverlap(s.section, o.section)))
      .map((s) => s.section.id),
  );

  const blocks: { row: SectionRow; tone: BlockTone }[] = [
    ...enrolled.map((row) => ({ row, tone: "enrolled" as const })),
    ...staged.map((row) => ({
      row,
      tone: clashing.has(row.section.id) ? ("clash" as const) : ("staged" as const),
    })),
  ];

  const enrolledCredits = credits(enrolled);
  const stagedCredits = credits(staged);

  return (
    <div className="flex flex-col gap-2.5 pt-0.5">
      <div className={cn(CARD, "flex min-h-[50px] flex-wrap items-center gap-x-6 gap-y-2 px-[19px] py-2.5")}>
        <h1 className="text-sm font-bold text-[#0f172a]">Weekly Schedule Grid | Academic Year 2026/1</h1>
        <p className="text-xs font-medium text-[#64748b]">
          {enrolledCredits + stagedCredits} Total Credits ({enrolledCredits} Enrolled, {stagedCredits} In Cart)
        </p>
        <div className="ml-auto flex flex-wrap gap-2.5">
          <Pill tone="solid" className="px-[13px] font-semibold">
            Enrolled ({enrolled.length} {enrolled.length === 1 ? "Course" : "Courses"})
          </Pill>
          <Pill tone="orange" className="px-[13px] font-semibold">
            In Cart / Staged ({staged.length})
          </Pill>
          <Pill tone={clashing.size ? "red" : "green"} className="px-[13px]">
            {clashing.size} Schedule {clashing.size === 1 ? "Clash" : "Clashes"}
          </Pill>
        </div>
      </div>

      {error ? (
        <Notice title="Couldn't load your timetable" description={toUserMessage(error)} />
      ) : (
        <div className={cn(CARD, "overflow-x-auto")}>
          <div className="min-w-[900px] pt-[11px] pr-[19px] pb-[37px] pl-[75px]">
            <div className="grid h-9 grid-cols-5 items-center rounded-md border border-[#e2e8f0] bg-[#f8fafc] text-center text-xs font-bold text-[#334155] uppercase">
              {DAYS.map((d) => (
                <span key={d.value}>{d.label}</span>
              ))}
            </div>

            <div className="relative" style={{ height: GRID_HEIGHT }}>
              {HOURS.map((hour, i) => {
                const y = GRID_LEAD + i * HOUR_PX;
                return (
                  <div key={hour}>
                    <span
                      className="absolute -left-[62px] text-[11px] leading-[14px] font-semibold text-[#94a3b8]"
                      style={{ top: y - 7 }}
                    >
                      {String(hour).padStart(2, "0")}:00
                    </span>
                    <div className="absolute right-0 -left-1 h-px bg-[#f1f5f9]" style={{ top: y }} />
                  </div>
                );
              })}

              <div className="absolute inset-0 grid grid-cols-5">
                {DAYS.map((day) => (
                  <div key={day.value} className="relative border-l border-[#f1f5f9] last:border-r">
                    {blocks
                      .filter(({ row }) => row.section.schedule_days.includes(day.value))
                      .map(({ row, tone }) => (
                        <TimetableBlock key={`${tone}-${row.section.id}`} row={row} tone={tone} />
                      ))}
                  </div>
                ))}
              </div>

              {!isLoading && blocks.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
                  <div className="text-sm font-bold text-[#475569]">No Classes Scheduled Yet</div>
                  <p className="text-xs text-[#94a3b8]">
                    Sections you add to the cart or enroll in will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
