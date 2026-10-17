import { Check, ChevronDown, Clock, Plus, RotateCcw, Search, TriangleAlert, X } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import type { Day, PrereqResult, SectionRow } from "@/api/types";
import { notify } from "@/components/notify";
import { CodeChip, Dot, Notice, Pill } from "@/components/portal";
import { checkPrereqs, sectionsOverlap } from "@/features/cart/rules";
import { useCartStore } from "@/features/cart/store";
import { useCartRows } from "@/features/cart/useCartRows";
import { useEnroll } from "@/features/enrollment/useEnroll";
import { useEnrolledRows } from "@/features/enrollment/useMyEnrollments";
import { useWaitlistRows } from "@/features/enrollment/useMyWaitlist";
import { useCompletedCourses } from "@/features/student/useCompletedCourses";
import { toUserMessage } from "@/lib/errors";
import {
  BUTTON,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  BUTTON_WAITLIST,
  CARD,
  formatSchedule,
  secNo,
  sectionName,
} from "@/lib/portal";
import { useDebounced } from "@/lib/useDebounced";
import { cn } from "@/lib/utils";
import { isFull } from "./seats";
import { type CatalogFilters, useCatalog } from "./useCatalog";

const DAYS: { value: Day; label: string }[] = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
];

// The catalog API filters by department name, but has no endpoint that lists departments yet
const DEPARTMENTS = ["Computer Engineering"];

const DEFAULT_FILTERS: CatalogFilters = { search: "", department: "", day: undefined, openOnly: false };

// Column widths measured on the Penpot board (788px wide section table inside each course card)
const COLUMNS = "grid grid-cols-[40fr_120fr_165fr_55fr_85fr_95fr_135fr] items-center gap-x-2 px-3";

const FIELD =
  "h-10 rounded-md border border-[#cbd5e1] text-[13px] font-medium text-[#0f172a] outline-none focus-visible:border-[#ff5722] focus-visible:ring-2 focus-visible:ring-[#ff5722]/30";

type Course = { row: SectionRow; sections: SectionRow[] };

// Penpot "Design #1" > Desktop - Registration Portal > Left Pane - Course Catalog
export function CatalogPane() {
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const search = useDebounced(filters.search.trim());
  const { rows, isLoading, error } = useCatalog({ ...filters, search });

  // One card per course, sections in number order
  const courses = useMemo<Course[]>(() => {
    const byCode = new Map<string, Course>();
    for (const row of rows) {
      const course = byCode.get(row.course.code) ?? { row, sections: [] };
      course.sections.push(row);
      byCode.set(row.course.code, course);
    }
    for (const c of byCode.values()) c.sections.sort((a, b) => a.section.section_number - b.section.section_number);
    return [...byCode.values()].sort((a, b) => a.row.course.code.localeCompare(b.row.course.code));
  }, [rows]);

  const completed = useCompletedCourses();
  const prereqs = checkPrereqs(
    courses.map((c) => c.row),
    completed.data,
  );

  // What the student already has: a new section may not overlap any of it
  const cart = useCartRows();
  const enrolled = useEnrolledRows();
  const waitlist = useWaitlistRows();
  const mine: Mine = {
    // While enrollments load, the overlap check would miss them, so adding waits
    taken: enrolled.isLoading ? null : [...enrolled.rows, ...cart],
    enrolledIds: new Set(enrolled.rows.map((r) => r.section.id)),
    waitlist: new Map(waitlist.rows.map((w) => [w.entry.section_id, w.entry.position])),
  };

  const update = (patch: Partial<CatalogFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters(DEFAULT_FILTERS);

  return (
    <section aria-label="Course catalog" className="flex min-w-0 flex-col gap-4">
      <div className={cn(CARD, "flex flex-wrap items-center gap-3 px-4 py-3.5")}>
        <label className="relative w-full sm:w-[270px]">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#64748b]" />
          <input
            type="search"
            aria-label="Search course code or title"
            placeholder="Search Course Code or Title..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className={cn(FIELD, "w-full bg-[#f8fafc] pr-3 pl-9 font-normal placeholder:text-[#94a3b8]")}
          />
        </label>

        <Select
          aria-label="Department"
          value={filters.department}
          onChange={(department) => update({ department })}
          className="w-[190px]"
        >
          <option value="">Dept: All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              Dept: {d}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Day"
          value={filters.day ?? ""}
          onChange={(value) => update({ day: (value || undefined) as Day | undefined })}
          className="w-[135px]"
        >
          <option value="">Day: All Days</option>
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              Day: {d.label}
            </option>
          ))}
        </Select>

        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#f1f5f9] px-2.5 text-xs font-semibold text-[#0f172a] has-focus-visible:ring-2 has-focus-visible:ring-[#ff5722]/40">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={filters.openOnly}
            onChange={(e) => update({ openOnly: e.target.checked })}
          />
          <span
            aria-hidden
            className="flex size-[18px] items-center justify-center rounded border border-[#cbd5e1] bg-white text-white peer-checked:border-[#ff5722] peer-checked:bg-[#ff5722] [&_svg]:invisible peer-checked:[&_svg]:visible"
          >
            <Check className="size-3" strokeWidth={3.5} />
          </span>
          Open Seats Only
        </label>
      </div>

      {isLoading ? (
        <Notice title="Loading courses..." />
      ) : error ? (
        <Notice title="Couldn't load the catalog" description={toUserMessage(error)} />
      ) : courses.length === 0 ? (
        <Notice
          title="No Courses Found"
          description={
            search
              ? `No sections matched "${search}" with current department and day filters.`
              : "No sections matched the current filters."
          }
          icon={<Search />}
          className="min-h-[260px]"
          action={
            <button type="button" onClick={reset} className={cn(BUTTON, BUTTON_SECONDARY, "mt-1 h-10 w-[180px] text-[13px]")}>
              <RotateCcw />
              Reset All Filters
            </button>
          }
        />
      ) : (
        courses.map((c) => (
          <CourseCard key={c.row.course.code} course={c} prereq={prereqs[c.row.course.code]} mine={mine} />
        ))
      )}
    </section>
  );
}

type Mine = {
  taken: SectionRow[] | null; // enrolled + cart; null while enrollments load
  enrolledIds: Set<number>;
  waitlist: Map<number, number>; // section id -> queue position
};

function CourseCard({ course, prereq, mine }: { course: Course; prereq: PrereqResult | undefined; mine: Mine }) {
  const { code, title, credits } = course.row.course;
  const blocked = prereq?.is_valid === false;

  return (
    <article aria-label={`${code} ${title}`} className={cn(CARD, "p-4")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <CodeChip code={code} />
          <h2 className="truncate text-[15px] font-bold text-[#0f172a]">
            {title} ({credits} Credits)
          </h2>
        </div>
        <PrereqPill required={course.row.course.prerequisites} result={prereq} />
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="min-w-[700px]">
          <div className={cn(COLUMNS, "h-[34px] rounded-md bg-[#f8fafc] text-[11px] font-bold text-[#64748b]")}>
            <span>Sec</span>
            <span>Instructor</span>
            <span>Schedule & Time</span>
            <span>Room</span>
            <span>Capacity</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {course.sections.map((row) => (
              <SectionLine key={row.section.id} row={row} blocked={blocked} mine={mine} />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function PrereqPill({ required, result }: { required: string[]; result: PrereqResult | undefined }) {
  if (required.length === 0) return <Pill tone="neutral">No Prerequisites</Pill>;
  const list = required.join(", ");
  // Not checked (yet): show what is required without a verdict
  if (!result) return <Pill tone="neutral">Prereqs: {list}</Pill>;
  return result.is_valid ? (
    <Pill tone="green" className="h-[26px] px-4 text-xs font-semibold">
      {list} [ MET <Dot tone="green" /> ]
    </Pill>
  ) : (
    <Pill tone="red" className="h-[26px] px-4 text-xs font-semibold">
      {list} [ MISSING <Dot tone="red" /> {result.missing_prereqs.join(", ")} ]
    </Pill>
  );
}

function SectionLine({ row, blocked, mine }: { row: SectionRow; blocked: boolean; mine: Mine }) {
  const { section } = row;
  const full = isFull(section);

  return (
    <div
      role="group"
      aria-label={sectionName(section)}
      className={cn(COLUMNS, "h-[52px] rounded-md border border-[#f1f5f9] bg-white")}
    >
      <span className="text-[13px] font-bold text-[#0f172a]">{secNo(section.section_number)}</span>
      <span className="truncate text-[13px] text-[#334155]">{section.instructor}</span>
      <span className="truncate text-[13px] font-medium text-[#0f172a]">{formatSchedule(section)}</span>
      <span className="truncate text-[13px] font-semibold text-[#64748b]">{section.room}</span>
      <span className={cn("text-xs font-semibold", full ? "text-[#991b1b]" : "text-[#065f46]")}>
        {section.enrolled_count}/{section.capacity}
      </span>
      <span>
        <Pill tone={full ? "red" : "green"} className="w-[95px]">
          <Dot tone={full ? "red" : "green"} />
          {full ? "FULL" : "OPEN"}
        </Pill>
      </span>
      <SectionAction row={row} blocked={blocked} mine={mine} />
    </div>
  );
}

function SectionAction({ row, blocked, mine }: { row: SectionRow; blocked: boolean; mine: Mine }) {
  const id = row.section.id;
  const inCart = useCartStore((s) => s.sectionIds.includes(id));
  const add = useCartStore((s) => s.add);
  const remove = useCartStore((s) => s.remove);
  const enroll = useEnroll();
  const position = mine.waitlist.get(id);

  // Refuse a section that overlaps one already in the cart or enrolled, and say which one
  function addToCart() {
    if (!mine.taken) return;
    const clash = mine.taken.find((t) => t.section.id !== id && sectionsOverlap(row.section, t.section));
    if (clash) {
      notify.error(
        "Timetable conflict detected",
        `${sectionName(row.section)} overlaps with ${sectionName(clash.section)} (${formatSchedule(clash.section)}).`,
      );
      return;
    }
    add(id);
  }

  const wide = "w-full max-w-[135px]";

  if (mine.enrolledIds.has(id)) {
    return (
      <Action disabled className={cn(wide, "disabled:border-[#bfdbfe] disabled:bg-[#eff6ff] disabled:text-[#1d4ed8]")}>
        <Check />
        Enrolled
      </Action>
    );
  }
  if (position !== undefined) {
    return (
      <Action disabled className={cn(wide, "disabled:border-[#fde68a] disabled:bg-[#fffbeb] disabled:text-[#92400e]")}>
        <Clock />
        Queue #{position}
      </Action>
    );
  }
  if (inCart) {
    return (
      <Action onClick={() => remove(id)} className={cn(wide, BUTTON_SECONDARY)}>
        <X />
        Remove
      </Action>
    );
  }
  if (blocked) {
    return (
      <Action disabled className={wide} title="Missing prerequisites">
        Blocked
        <TriangleAlert className="text-[#f59e0b]" />
      </Action>
    );
  }
  if (isFull(row.section)) {
    return (
      <Action disabled={enroll.isPending} onClick={() => enroll.mutate(id)} className={cn(wide, BUTTON_WAITLIST)}>
        {enroll.isPending ? "Joining..." : "Waitlist"}
        <Clock />
      </Action>
    );
  }
  return (
    <Action disabled={!mine.taken} onClick={addToCart} className={cn(wide, BUTTON_PRIMARY)}>
      <Plus strokeWidth={3} />
      Add Cart
    </Action>
  );
}

function Action({
  className,
  children,
  ...props
}: { className?: string; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn(BUTTON, className)} {...props}>
      {children}
    </button>
  );
}

function Select({
  value,
  onChange,
  className,
  children,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  children: ReactNode;
  "aria-label": string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(FIELD, "w-full appearance-none bg-white pr-8 pl-3")}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-[#64748b]" />
    </div>
  );
}
