import { ChevronDown } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { Link } from "react-router";
import type { Day, SectionRow } from "@/api/types";
import { sectionsOverlap } from "@/features/cart/rules";
import { useCartStore } from "@/features/cart/store";
import { useCartRows } from "@/features/cart/useCartRows";
import { useEnroll } from "@/features/enrollment/useEnroll";
import { Divider, Notice, SectionBadge } from "@/components/portal";
import { toUserMessage } from "@/lib/errors";
import { BUTTON, BUTTON_NEUTRAL, BUTTON_PRIMARY, BUTTON_SOFT, formatSchedule } from "@/lib/portal";
import { cn } from "@/lib/utils";
import { SeatBadge } from "./SeatBadge";
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

// Column widths measured on the Penpot board (1232px wide rows); fr keeps the ratio on other widths
const COLUMNS = "grid grid-cols-[396fr_90fr_210fr_180fr_150fr_185fr] items-center pl-[19px]";

const FIELD =
  "h-[42px] rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-[13px] text-xs outline-none focus-visible:border-[#ff6b00] focus-visible:ring-2 focus-visible:ring-[#ff6b00]/30";

// View 1: Course Catalog & Section Search (Penpot "Initial Draft" > Screen 1)
export function CatalogPage() {
  // `draft` is what the form shows; `applied` is what was last sent to the API by "Apply Filter"
  const [draft, setDraft] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const { rows, isLoading, error } = useCatalog(applied);

  const update = (patch: Partial<CatalogFilters>) => setDraft((f) => ({ ...f, ...patch }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setApplied(draft);
  }

  function reset() {
    setDraft(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
  }

  return (
    <div className="flex flex-col">
      <form
        onSubmit={onSubmit}
        className="flex flex-wrap items-end gap-4 rounded-[10px] border border-[#e2e8f0] bg-white px-[19px] pt-[11px] pb-[21px]"
      >
        <Field label="Course keyword or code" className="w-full sm:w-80">
          <input
            type="search"
            aria-label="Course keyword or code"
            placeholder="Search code or title (e.g. CS101, Software)"
            className={cn(FIELD, "w-full text-[#1e293b] placeholder:text-[#64748b]")}
            value={draft.search}
            onChange={(e) => update({ search: e.target.value })}
          />
        </Field>

        <Field label="Department" className="w-[230px]">
          <Select
            aria-label="Department"
            value={draft.department}
            onChange={(value) => update({ department: value })}
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Schedule day" className="w-[140px]">
          <Select
            aria-label="Schedule day"
            value={draft.day ?? ""}
            onChange={(value) => update({ day: (value || undefined) as Day | undefined })}
          >
            <option value="">All Days</option>
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Availability">
          <label className="flex h-[42px] cursor-pointer items-center gap-2 text-xs font-semibold text-[#334155]">
            <input
              type="checkbox"
              role="switch"
              className="peer sr-only"
              checked={draft.openOnly}
              onChange={(e) => update({ openOnly: e.target.checked })}
            />
            <span className="relative h-[22px] w-[38px] rounded-full bg-[#cbd5e1] transition-colors peer-checked:bg-[#ff6b00] peer-focus-visible:ring-2 peer-focus-visible:ring-[#ff6b00]/40 peer-focus-visible:ring-offset-1 after:absolute after:top-[3px] after:left-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-3.5" />
            Open Sections Only
          </label>
        </Field>

        <div className="ml-auto flex gap-3">
          <button type="submit" className={cn(BUTTON, BUTTON_PRIMARY, "h-[42px] w-[140px]")}>
            Apply Filter
          </button>
          <button type="button" onClick={reset} className={cn(BUTTON, BUTTON_NEUTRAL, "h-[42px] w-[84px]")}>
            Reset
          </button>
        </div>
      </form>

      <div className="mt-3.5 overflow-x-auto">
        <div className="min-w-[1040px]">
          <div
            className={cn(
              COLUMNS,
              "h-9 rounded-md border border-[#e2e8f0] bg-[#f1f5f9] text-[10px] font-bold text-[#64748b] uppercase",
            )}
          >
            <span>Course & Details</span>
            <span className="pl-1">Section</span>
            <span>Schedule & Room</span>
            <span>Instructor</span>
            <span className="pl-1">Seat Status</span>
            <span className="pl-3.5">Action</span>
          </div>

          <div className="mt-2.5 flex flex-col gap-2">
            {isLoading ? (
              <Notice title="Loading courses..." />
            ) : error ? (
              <Notice title="Couldn't load the catalog" description={toUserMessage(error)} />
            ) : rows.length === 0 ? (
              <Notice
                title="No Courses Found"
                description="No sections matched the current filters."
                action={
                  <button type="button" onClick={reset} className={cn(BUTTON, BUTTON_NEUTRAL, "px-4")}>
                    Reset All Filters
                  </button>
                }
              />
            ) : (
              rows.map((row) => <SectionRowCard key={row.section.id} row={row} />)
            )}
          </div>
        </div>
      </div>

      <CartStatusBar />
    </div>
  );
}

function SectionRowCard({ row }: { row: SectionRow }) {
  const { section, course } = row;
  return (
    <div className={cn(COLUMNS, "h-[74px] rounded-lg border border-[#e2e8f0] bg-white")}>
      <div className="-mt-0.5 min-w-0 pr-4">
        <div className="truncate text-sm leading-[17px] font-bold text-[#0f172a]">
          {course.code} - {course.title}
        </div>
        <div className="mt-[9px] truncate text-[11px] leading-[14px] text-[#64748b]">
          {course.credits} Credits
          <Divider />
          Prereq: {course.prerequisites.length ? course.prerequisites.join(", ") : "None"}
        </div>
      </div>

      <div>
        <SectionBadge number={section.section_number} className="h-7" />
      </div>

      <div className="-mt-0.5 min-w-0 pr-4">
        <div className="truncate text-[13px] leading-4 font-semibold text-[#1e293b]">
          {formatSchedule(section)}
        </div>
        <div className="mt-[9px] truncate text-[11px] leading-[14px] font-semibold text-[#ea580c]">
          Room: {section.room}
        </div>
      </div>

      <div className="min-w-0 truncate pr-4 text-[13px] font-semibold text-[#334155]">
        {section.instructor}
      </div>

      <div>
        <SeatBadge section={section} />
      </div>

      <div>
        <SectionAction row={row} />
      </div>
    </div>
  );
}

function SectionAction({ row }: { row: SectionRow }) {
  const id = row.section.id;
  const inCart = useCartStore((s) => s.sectionIds.includes(id));
  const add = useCartStore((s) => s.add);
  const remove = useCartStore((s) => s.remove);
  const enroll = useEnroll();

  if (inCart) {
    return (
      <button type="button" onClick={() => remove(id)} className={cn(BUTTON, BUTTON_NEUTRAL, "w-[136px]")}>
        Remove from Cart
      </button>
    );
  }
  if (isFull(row.section)) {
    return (
      <button
        type="button"
        disabled={enroll.isPending}
        onClick={() => enroll.mutate(id)}
        className={cn(BUTTON, BUTTON_SOFT, "w-[136px]")}
      >
        {enroll.isPending ? "Joining..." : "Join Waitlist"}
      </button>
    );
  }
  return (
    <button type="button" onClick={() => add(id)} className={cn(BUTTON, BUTTON_PRIMARY, "w-[136px]")}>
      Add to Cart
    </button>
  );
}

function CartStatusBar() {
  const cart = useCartRows();
  const credits = cart.reduce((sum, r) => sum + r.course.credits, 0);
  // Every pair of staged sections that share a day and overlap in time
  const conflicts = cart.reduce(
    (count, a, i) => count + cart.slice(i + 1).filter((b) => sectionsOverlap(a.section, b.section)).length,
    0,
  );

  return (
    <div className="mt-[26px] flex min-h-[54px] flex-wrap items-center justify-between gap-3 rounded-lg border border-[#ffd2b2] bg-[#fff4ed] py-2 pr-[19px] pl-[19px]">
      <p className="text-xs font-semibold text-[#c2410c]">
        Cart Status: {cart.length} staged {cart.length === 1 ? "course" : "courses"} ({credits} Credits)
        <Divider />
        Prerequisites: checked in cart
        <Divider />
        {conflicts} Schedule {conflicts === 1 ? "Conflict" : "Conflicts"}
      </p>
      <Link to="/cart" className={cn(BUTTON, BUTTON_PRIMARY, "w-[212px]")}>
        Review Cart & Enroll →
      </Link>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-[10px] leading-3 font-bold text-[#64748b] uppercase">{label}</span>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  "aria-label": string;
}) {
  return (
    <div className="relative">
      <select
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(FIELD, "w-full appearance-none pr-8 font-semibold text-[#1e293b]")}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-[#1e293b]" />
    </div>
  );
}
