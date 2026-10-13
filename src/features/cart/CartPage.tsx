import { Link } from "react-router";
import type { PrereqResult, SectionRow } from "@/api/types";
import { Notice, Pill, SectionBadge } from "@/components/portal";
import { isFull } from "@/features/catalog/seats";
import { useEnrolledRows } from "@/features/enrollment/useMyEnrollments";
import { useCompletedCourses } from "@/features/student/useCompletedCourses";
import { toUserMessage } from "@/lib/errors";
import {
  BUTTON,
  BUTTON_DANGER,
  BUTTON_NEUTRAL,
  BUTTON_PRIMARY,
  CARD,
  formatSchedule,
  TABLE_HEAD,
  TABLE_ROW,
} from "@/lib/portal";
import { cn } from "@/lib/utils";
import { MAX_CREDITS, scheduleConflictRule, sectionsOverlap } from "./rules";
import { useCartStore } from "./store";
import { useCartRows } from "./useCartRows";
import { useConfirmCart } from "./useConfirmCart";
import { usePrereqChecks } from "./usePrereqChecks";

// Column widths measured on the Penpot board (1232px wide rows)
const COLUMNS = "grid grid-cols-[400fr_86fr_80fr_180fr_180fr_140fr_145fr] pl-[19px]";

const LABEL = "text-[11px] leading-[14px] font-bold text-[#64748b] uppercase";

const credits = (rows: SectionRow[]) => rows.reduce((sum, r) => sum + r.course.credits, 0);
const sectionName = (r: SectionRow) => `${r.course.code} Sec ${r.section.section_number}`;

// View 3: Cart & Pre-Flight Validation (Penpot "Initial Draft" > Screen 3)
export function CartPage() {
  const cart = useCartRows();
  const { rows: enrolled } = useEnrolledRows();
  const completed = useCompletedCourses();
  const prereqs = usePrereqChecks(cart, completed.data);
  const clear = useCartStore((s) => s.clear);
  const confirm = useConfirmCart();

  // Only sections whose prerequisites are met get submitted; the others stay in the cart
  const eligible = cart.filter((r) => prereqs[r.course.code]?.is_valid);
  const blocked = cart.filter((r) => prereqs[r.course.code]?.is_valid === false);
  const checking = cart.length > 0 && cart.some((r) => !prereqs[r.course.code]);

  const enrolledCredits = credits(enrolled);
  const proposed = enrolledCredits + credits(eligible);
  const overCap = proposed > MAX_CREDITS;

  const clash = scheduleConflictRule({ cart, enrolled, prereqs });
  const clashCount = cart.filter((c) =>
    [...enrolled, ...cart].some((o) => o.section.id !== c.section.id && sectionsOverlap(c.section, o.section)),
  ).length;

  const canConfirm = eligible.length > 0 && !checking && !overCap && clash.ok && !confirm.isPending;

  // The first problem that stops (part of) the cart from being submitted
  const gate: { ok: boolean; message: string } = completed.error
    ? { ok: false, message: `Prerequisites can't be checked: ${toUserMessage(completed.error)}` }
    : cart.length === 0
      ? { ok: false, message: "Your cart is empty. Add sections from the catalog to validate them here." }
      : checking
        ? { ok: false, message: "Checking prerequisites..." }
        : !clash.ok
          ? { ok: false, message: `${clash.message}. Remove one of them to continue.` }
          : overCap
            ? {
                ok: false,
                message: `Proposed total of ${proposed} credits is over the ${MAX_CREDITS} credit cap. Remove a course to continue.`,
              }
            : blocked.length > 0
              ? {
                  ok: false,
                  message: `Enrollment for ${blocked.map((r) => r.course.code).join(", ")} is blocked due to missing prerequisite ${blocked
                    .flatMap((r) => prereqs[r.course.code]?.missing_prereqs ?? [])
                    .join(", ")}. Remove it or confirm eligible courses only.`,
                }
              : { ok: true, message: "All checks passed. Your cart is ready to enroll." };

  return (
    <div className="flex flex-col pt-0.5">
      {/* Pre-flight summary */}
      <div className={cn(CARD, "grid min-h-[124px] py-[11px] md:grid-cols-[366fr_420fr_446fr]")}>
        <div className="px-[19px] py-0.5">
          <div className={LABEL}>Total planned credits</div>
          <div className="mt-2 text-[22px] leading-[27px] font-extrabold text-[#0f172a]">
            {proposed} / {MAX_CREDITS} Credits
          </div>
          <div className="mt-[9px] h-2 max-w-[310px] overflow-hidden rounded bg-[#f1f5f9]">
            <div
              className={cn("h-full rounded", overCap ? "bg-[#dc2626]" : "bg-[#ff6b00]")}
              style={{ width: `${Math.min(100, (proposed / MAX_CREDITS) * 100)}%` }}
            />
          </div>
          <p className="mt-2.5 text-[11px] leading-[14px] font-medium text-[#64748b]">
            {overCap
              ? `${proposed - MAX_CREDITS} Credits over the maximum semester cap`
              : `${MAX_CREDITS - proposed} Credits remaining before maximum semester cap`}
          </p>
        </div>

        <div className="border-[#f1f5f9] px-[19px] py-0.5 max-md:border-t max-md:pt-3 md:border-l">
          <div className={LABEL}>Prerequisites engine (Catalog Service API)</div>
          <Pill
            tone={blocked.length ? "orange" : checking || cart.length === 0 ? "neutral" : "green"}
            className="mt-2"
          >
            {cart.length === 0
              ? "No staged courses"
              : checking
                ? "Checking prerequisites..."
                : blocked.length
                  ? `Alert: ${blocked.length} Missing ${blocked.length === 1 ? "Prerequisite" : "Prerequisites"}`
                  : "All Prerequisites Met"}
          </Pill>
          <ul className="mt-2 flex flex-col gap-1">
            {cart.map((r) => (
              <PrereqLine key={r.section.id} row={r} result={prereqs[r.course.code]} />
            ))}
          </ul>
        </div>

        <div className="border-[#f1f5f9] px-[19px] py-0.5 max-md:border-t max-md:pt-3 md:border-l">
          <div className={LABEL}>Schedule clash engine</div>
          <Pill tone={clash.ok ? "green" : "red"} className="mt-2">
            {clash.ok ? "Clashes: None (0 Detected)" : `Clashes: ${clashCount} Detected`}
          </Pill>
          <p className="mt-2.5 text-xs leading-[15px] font-semibold text-[#1e293b]">
            {clash.ok ? "No overlapping class time slots detected." : clash.message}
          </p>
          <p className="mt-[3px] text-[11px] leading-[14px] font-medium text-[#64748b]">
            {cart.length === 0
              ? "Staged sections are checked against your enrolled courses."
              : clash.ok
                ? `All ${cart.length} staged ${cart.length === 1 ? "section fits" : "sections fit"} with enrolled courses.`
                : "Remove one of the overlapping sections to continue."}
          </p>
        </div>
      </div>

      {/* Staged sections */}
      <div className="mt-3.5 overflow-x-auto">
        <div className="min-w-[1040px]">
          <div className={cn(COLUMNS, TABLE_HEAD, "h-9")}>
            <span>Staged course & details</span>
            <span>Section</span>
            <span>Credits</span>
            <span>Schedule & room</span>
            <span className="pl-2.5">Prerequisite status</span>
            <span>Seats</span>
            <span className="pl-2.5">Action</span>
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {cart.length === 0 ? (
              <Notice
                title="Your Cart is Empty"
                description="Browse or search courses in the catalog to stage sections onto your schedule."
                action={
                  <Link to="/catalog" className={cn(BUTTON, BUTTON_NEUTRAL, "px-4")}>
                    Go to Catalog
                  </Link>
                }
              />
            ) : (
              cart.map((r) => <CartRow key={r.section.id} row={r} result={prereqs[r.course.code]} />)
            )}
          </div>
        </div>
      </div>

      {/* Gatekeeper and submit */}
      <div className={cn(CARD, "mt-[30px] flex flex-col gap-3.5 px-[19px] pt-[15px] pb-[23px]")}>
        <p
          role="status"
          className={cn(
            "flex min-h-[42px] items-center rounded-md border px-[15px] py-2 text-xs font-semibold",
            gate.ok
              ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#047857]"
              : "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]",
          )}
        >
          Pre-Flight Gatekeeper: {gate.message}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] font-semibold text-[#334155]">
            Cart Summary: {eligible.length} Eligible {eligible.length === 1 ? "Course" : "Courses"} (
            {credits(eligible)} Credits)
            <span aria-hidden className="mx-2">
              |
            </span>
            Current Enrolled: {enrolledCredits} Credits
            <span aria-hidden className="mx-2">
              |
            </span>
            Proposed Total: {proposed} Credits
          </p>

          <div className="flex gap-3.5">
            <button
              type="button"
              disabled={cart.length === 0 || confirm.isPending}
              onClick={clear}
              className={cn(
                BUTTON,
                "h-11 w-[110px] border border-[#cbd5e1] bg-[#f1f5f9] text-[13px] font-semibold text-[#64748b] hover:bg-[#e2e8f0]",
              )}
            >
              Clear Cart
            </button>
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => confirm.mutate(eligible.map((r) => r.section.id))}
              className={cn(BUTTON, BUTTON_PRIMARY, "h-11 min-w-[282px] px-5 text-[13px]")}
            >
              {confirm.isPending ? "Enrolling..." : `Confirm & Enroll (${eligible.length} Eligible) →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrereqLine({ row, result }: { row: SectionRow; result: PrereqResult | undefined }) {
  if (!result) {
    return <li className="text-[11px] leading-[14px] font-medium text-[#64748b]">{sectionName(row)}: checking...</li>;
  }
  if (!result.is_valid) {
    return (
      <li className="text-[11px] leading-[14px] font-bold text-[#b91c1c]">
        [MISSING] {sectionName(row)}: Requires {result.missing_prereqs.join(", ")}
      </li>
    );
  }
  const required = row.course.prerequisites;
  return (
    <li className="text-[11px] leading-[14px] font-semibold text-[#047857]">
      [MET] {sectionName(row)}: {required.length ? `${required.join(", ")} completed` : "no prerequisites"}
    </li>
  );
}

function CartRow({ row, result }: { row: SectionRow; result: PrereqResult | undefined }) {
  const { section, course } = row;
  const remove = useCartStore((s) => s.remove);
  const missing = result?.is_valid === false;
  const full = isFull(section);
  const left = section.capacity - section.enrolled_count;

  return (
    <div
      className={cn(
        COLUMNS,
        TABLE_ROW,
        "h-[78px] rounded-lg",
        // The thicker red border would shift the content by 1px, so the padding gives it back
        missing && "border-2 border-[#fecaca] bg-[#fffdfd] pl-[18px]",
      )}
    >
      <div className="-mt-1 min-w-0 pr-4">
        <div className="truncate text-sm leading-[17px] font-bold text-[#0f172a]">
          {course.code} - {course.title}
        </div>
        <div className="mt-[9px] truncate text-[11px] leading-[14px] text-[#64748b]">{section.instructor}</div>
      </div>

      <div>
        <SectionBadge number={section.section_number} className="h-7" />
      </div>

      <div className="text-xs font-semibold text-[#1e293b]">{course.credits} Credits</div>

      <div className="-mt-1 min-w-0 pr-4">
        <div className="truncate text-[13px] leading-4 font-semibold text-[#1e293b]">{formatSchedule(section)}</div>
        <div className="mt-2 truncate text-[11px] leading-[14px] font-medium text-[#ea580c]">
          Room: {section.room}
        </div>
      </div>

      <div className="min-w-0">
        <Pill
          tone={!result ? "neutral" : missing ? "red" : "green"}
          className="h-7 max-w-full min-w-[168px] overflow-hidden"
        >
          <span className="truncate">
            {!result
              ? "Prereqs: checking..."
              : missing
                ? `Prereqs: MISSING ${result.missing_prereqs.join(", ")}`
                : "Prereqs: MET"}
          </span>
        </Pill>
      </div>

      <div className={cn("text-xs font-semibold", full ? "text-[#b91c1c]" : "text-[#059669]")}>
        {section.enrolled_count}/{section.capacity} {full ? "FULL" : `OPEN (${left} Left)`}
      </div>

      <div>
        <button
          type="button"
          onClick={() => remove(section.id)}
          className={cn(BUTTON, BUTTON_DANGER, "h-[34px] w-[90px]")}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
