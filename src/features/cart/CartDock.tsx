import { Hourglass, ShoppingCart, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import type { PrereqResult, SectionRow } from "@/api/types";
import { Dot, type Tone } from "@/components/portal";
import { isFull } from "@/features/catalog/seats";
import { useEnrolledRows } from "@/features/enrollment/useMyEnrollments";
import { useCompletedCourses } from "@/features/student/useCompletedCourses";
import { toUserMessage } from "@/lib/errors";
import { BUTTON, BUTTON_PRIMARY, CARD, formatSchedule, secNo, sectionName } from "@/lib/portal";
import { cn } from "@/lib/utils";
import { MAX_CREDITS, checkPrereqs, sectionsOverlap } from "./rules";
import { SeatDepletedDialog } from "./SeatDepletedDialog";
import { useCartStore } from "./store";
import { useCartRows } from "./useCartRows";
import { useConfirmCart } from "./useConfirmCart";

const credits = (rows: SectionRow[]) => rows.reduce((sum, r) => sum + r.course.credits, 0);

const CHECK_TONES: Partial<Record<Tone, string>> = {
  green: "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]",
  red: "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]",
  neutral: "border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b]",
};

// Penpot "Design #1" > Desktop - Registration Portal > Pre-Flight Validation Dock
export function CartDock() {
  const cart = useCartRows();
  const { rows: enrolled } = useEnrolledRows();
  const completed = useCompletedCourses();
  const prereqs = checkPrereqs(cart, completed.data);
  const clear = useCartStore((s) => s.clear);
  const confirm = useConfirmCart();
  // Sections that filled up while confirming; the dialog walks through them one at a time
  const [depleted, setDepleted] = useState<SectionRow[]>([]);

  // Only sections whose prerequisites are met get submitted; the others stay in the cart
  const eligible = cart.filter((r) => prereqs[r.course.code]?.is_valid);
  const blocked = cart.filter((r) => prereqs[r.course.code]?.is_valid === false);
  const checking = cart.length > 0 && !completed.error && cart.some((r) => !prereqs[r.course.code]);

  const proposed = credits(enrolled) + credits(eligible);
  const overCap = proposed > MAX_CREDITS;

  // Each staged section that overlaps something else, with the first section it hits
  const clashes = cart.flatMap((c) => {
    const other = [...enrolled, ...cart].find(
      (o) => o.section.id !== c.section.id && sectionsOverlap(c.section, o.section),
    );
    return other ? [{ row: c, other }] : [];
  });

  const canConfirm = eligible.length > 0 && !checking && !overCap && clashes.length === 0 && !confirm.isPending;

  // The first problem that stops (part of) the cart from being submitted
  const problem = completed.error
    ? `Prerequisites can't be checked: ${toUserMessage(completed.error)}`
    : clashes.length
      ? `${sectionName(clashes[0].row.section)} overlaps with ${sectionName(clashes[0].other.section)}. Remove one of them to continue.`
      : overCap
        ? `Proposed total of ${proposed} credits is over the ${MAX_CREDITS} credit cap. Remove a course to continue.`
        : blocked.length
          ? `${blocked.map((r) => r.course.code).join(", ")} can't be enrolled: missing ${blocked
              .flatMap((r) => prereqs[r.course.code]?.missing_prereqs ?? [])
              .join(", ")}. Only eligible courses will be submitted.`
          : null;

  function submit() {
    confirm.mutate(eligible, {
      onSuccess: (outcomes) =>
        setDepleted(outcomes.filter((o) => o.result?.status === "WAITLISTED").map((o) => o.row)),
    });
  }

  return (
    <section aria-label="Cart" className={cn(CARD, "rounded-xl p-4")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[13px] font-bold text-[#0f172a]">STAGED COURSES IN CART ({cart.length})</h2>
        <span className="text-[11px] font-medium text-[#64748b]">Pre-Flight Verification</span>
      </div>

      {cart.length === 0 ? (
        <div className="mt-3.5 flex min-h-[110px] flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-4 text-center">
          <ShoppingCart aria-hidden className="mb-1 size-6 text-[#475569]" />
          <div className="text-[13px] font-bold text-[#475569]">Your Cart is Empty</div>
          <p className="text-xs text-[#94a3b8]">Browse or search courses on the left to stage sections onto your schedule.</p>
        </div>
      ) : (
        <ul className="mt-3.5 flex flex-col gap-3">
          {cart.map((r) => (
            <CartItem
              key={r.section.id}
              row={r}
              result={prereqs[r.course.code]}
              clashWith={clashes.find((c) => c.row.section.id === r.section.id)?.other}
            />
          ))}
        </ul>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Check tone={overCap ? "red" : "green"} dot>
          Credit: {proposed}/{MAX_CREDITS} [ {overCap ? "OVER" : "PASS"}
        </Check>
        {cart.length === 0 ? (
          <Check tone="neutral">Prerequisites: N/A [ — ]</Check>
        ) : checking || completed.error ? (
          <Check tone="neutral">Prereqs: [ {checking ? "CHECKING" : "UNKNOWN"} ]</Check>
        ) : (
          <Check tone={blocked.length ? "red" : "green"} dot>
            Prereqs: [ {blocked.length ? `${blocked.length} MISSING` : "PASS"}
          </Check>
        )}
        <Check tone={clashes.length ? "red" : "green"} dot>
          Clashes: {clashes.length || "None"} [
        </Check>
      </div>

      {cart.length > 0 && problem && (
        <p role="status" className="mt-2.5 text-[11px] leading-[15px] font-semibold text-[#b91c1c]">
          {problem}
        </p>
      )}

      <div className="mt-3 flex gap-6">
        <button
          type="button"
          disabled={cart.length === 0 || confirm.isPending}
          onClick={clear}
          className={cn(
            BUTTON,
            "h-[42px] w-[110px] shrink-0 border border-[#cbd5e1] bg-[#f1f5f9] font-semibold text-[#64748b] hover:bg-[#e2e8f0] active:bg-[#cbd5e1]",
          )}
        >
          Clear Cart
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={submit}
          className={cn(BUTTON, BUTTON_PRIMARY, "h-12 min-w-0 flex-1 text-[13px] uppercase [&_svg]:size-4")}
        >
          {confirm.isPending ? (
            <>
              <Hourglass />
              Enrolling...
            </>
          ) : (
            <>
              <Zap fill="currentColor" />
              Confirm Enrollment ({credits(eligible)} Credits)
            </>
          )}
        </button>
      </div>

      <SeatDepletedDialog
        row={depleted[0] ?? null}
        onDone={(next) => setDepleted((q) => (next ? [next, ...q.slice(1)] : q.slice(1)))}
      />
    </section>
  );
}

// One of the three pre-flight checks. `dot` closes the bracket with a status dot: "[ PASS ● ]".
function Check({ tone, dot, children }: { tone: Tone; dot?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center justify-center gap-1 rounded-full border px-2 text-[11px] font-semibold whitespace-nowrap",
        CHECK_TONES[tone],
      )}
    >
      {children}
      {dot && (
        <>
          <Dot tone={tone} />]
        </>
      )}
    </span>
  );
}

function CartItem({
  row,
  result,
  clashWith,
}: {
  row: SectionRow;
  result: PrereqResult | undefined;
  clashWith: SectionRow | undefined;
}) {
  const { section, course } = row;
  const remove = useCartStore((s) => s.remove);
  const missing = result?.is_valid === false;
  const full = isFull(section);
  const issue = missing
    ? `Missing ${result?.missing_prereqs.join(", ")}`
    : clashWith
      ? `Clashes with ${sectionName(clashWith.section)}`
      : full
        ? "Section full: confirming joins the waitlist"
        : null;

  return (
    <li
      className={cn(
        "flex min-h-[42px] items-center justify-between gap-3 rounded-md border bg-[#f8fafc] py-1.5 pr-2 pl-2.5",
        missing || clashWith ? "border-[#fecaca] bg-[#fffafa]" : "border-[#e2e8f0]",
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold text-[#0f172a]">
          {course.code} • {course.title} (Sec {secNo(section.section_number)})
        </div>
        <div className="truncate text-[10px] text-[#64748b]">
          {formatSchedule(section)} • {course.credits} Credits
          {issue && <span className="font-semibold text-[#b91c1c]"> • {issue}</span>}
        </div>
      </div>
      <button
        type="button"
        aria-label={`Remove ${sectionName(section)}`}
        onClick={() => remove(section.id)}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#64748b] outline-none hover:bg-[#fef2f2] hover:text-[#ef4444] focus-visible:ring-2 focus-visible:ring-[#ff5722]/40"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}
