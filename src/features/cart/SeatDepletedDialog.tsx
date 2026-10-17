import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, LogOut, Repeat, TriangleAlert, X } from "lucide-react";
import { drop, enroll } from "@/api/enrollments";
import type { SectionRow } from "@/api/types";
import { notify } from "@/components/notify";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { isFull } from "@/features/catalog/seats";
import { ALL_SECTIONS, useCatalog } from "@/features/catalog/useCatalog";
import { useDrop } from "@/features/enrollment/useDrop";
import { useEnrolledRows } from "@/features/enrollment/useMyEnrollments";
import { useWaitlistRows } from "@/features/enrollment/useMyWaitlist";
import { toUserMessage } from "@/lib/errors";
import { BUTTON, BUTTON_PRIMARY, formatSchedule, secNo } from "@/lib/portal";
import { cn } from "@/lib/utils";
import { sectionsOverlap } from "./rules";

const LABEL = "text-xs font-bold text-[#475569]";
const OPTION = cn(BUTTON, "h-10 w-full gap-2 text-[13px] font-semibold text-[#0f172a]");

const sectionName = (r: SectionRow) => `${r.course.code} Sec ${secNo(r.section.section_number)}`;

// Penpot "Design #1" > Overlay - Seat Depletion Conflict Modal.
// Shown after Confirm & Enroll when a section filled up between staging and submitting.
// The backend has already put the student on that section's waitlist; this asks what to do next.
// `onDone(next)` closes it, or shows `next` instead when switching ran into another full section.
export function SeatDepletedDialog({
  row,
  onDone,
}: {
  row: SectionRow | null;
  onDone: (next?: SectionRow) => void;
}) {
  const qc = useQueryClient();
  const waitlist = useWaitlistRows();
  const { rows: enrolled } = useEnrolledRows();
  const catalog = useCatalog(ALL_SECTIONS);
  const leave = useDrop();

  const position = row && waitlist.rows.find((w) => w.entry.section_id === row.section.id)?.entry.position;
  // Another open section of the same course that fits around the enrolled classes
  const alternative =
    row &&
    catalog.rows.find(
      (r) =>
        r.course.code === row.course.code &&
        r.section.id !== row.section.id &&
        !isFull(r.section) &&
        !enrolled.some((e) => sectionsOverlap(e.section, r.section)),
    );

  const switchSection = useMutation({
    // Leave the full section's queue first, so the student doesn't hold two places for one course
    mutationFn: async ({ from, to }: { from: SectionRow; to: SectionRow }) => {
      await drop(from.section.id);
      return enroll(to.section.id);
    },
    onSuccess: (result, { to }) => {
      qc.invalidateQueries({ queryKey: ["sections"] });
      qc.invalidateQueries({ queryKey: ["enrollments", "me"] });
      if (result.status === "ENROLLED") {
        notify.success("Enrollment successful", `Switched to ${sectionName(to)} (${to.course.credits} Credits).`);
        onDone();
      } else if (result.status === "WAITLISTED") {
        onDone(to);
      } else {
        notify.error(`${sectionName(to)} not enrolled`, result.message);
        onDone();
      }
    },
    onError: (err) => notify.error("Switch failed", toUserMessage(err)),
  });

  const busy = switchSection.isPending || leave.isPending;

  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && !busy && onDone()}>
      <DialogContent showCloseButton={false} className="gap-0 rounded-2xl bg-white p-6 sm:max-w-[520px]">
        {row && (
          <>
            <div className="flex h-8 items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2 text-[15px] font-bold text-[#991b1b] uppercase">
                <span aria-hidden className="size-3 shrink-0 rounded-full bg-[#ef4444]" />
                Registration failed: seat depleted
              </DialogTitle>
              <DialogClose
                aria-label="Close"
                disabled={busy}
                className="flex size-7 items-center justify-center rounded-md border border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a] focus-visible:outline-2 focus-visible:outline-[#ff6b00]"
              >
                <X className="size-3.5" strokeWidth={2.5} />
              </DialogClose>
            </div>

            <div className="mt-4 flex min-h-[70px] items-center gap-3 rounded-md border border-[#fca5a5] bg-[#fef2f2] px-3.5 py-3">
              <TriangleAlert aria-hidden className="size-5 shrink-0 text-[#f59e0b]" />
              <DialogDescription render={<div />} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#991b1b]">
                  While submitting, the final seat in {sectionName(row)} was claimed.
                </span>
                <span className="text-[11.5px] font-medium text-[#b91c1c]">
                  You were added to its waitlist. The rest of your cart was submitted as usual.
                </span>
              </DialogDescription>
            </div>

            <div className={cn(LABEL, "mt-4")}>Depleted Section:</div>
            <div className="mt-2 flex min-h-16 items-center justify-between gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5">
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-[#0f172a]">
                  {row.course.code} • {row.course.title} (Sec {secNo(row.section.section_number)})
                </div>
                <div className="mt-1 text-xs text-[#64748b]">
                  {row.section.instructor}
                  <span aria-hidden className="mx-2">|</span>
                  {formatSchedule(row.section)}
                  <span aria-hidden className="mx-2">|</span>
                  {row.section.room}
                </div>
              </div>
              <span className="flex h-[26px] shrink-0 items-center gap-1.5 rounded-full border border-[#fca5a5] bg-[#fef2f2] px-4 text-[11px] font-bold text-[#991b1b]">
                FULL
                <span aria-hidden className="size-2.5 rounded-full bg-[#ef4444]" />
              </span>
            </div>

            <div className={cn(LABEL, "mt-4")}>Resolution Options:</div>
            <div className="mt-2.5 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => onDone()}
                className={cn(BUTTON, BUTTON_PRIMARY, "h-[42px] w-full gap-2 text-[13px]")}
              >
                <Clock className="size-4" />
                Stay on Waitlist{position ? ` (Queue Position #${position})` : ""}
              </button>
              {alternative && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => switchSection.mutate({ from: row, to: alternative })}
                  className={cn(OPTION, "border border-[#cbd5e1] bg-white hover:bg-[#f8fafc]")}
                >
                  <Repeat className="size-4 text-[#ea580c]" />
                  {switchSection.isPending
                    ? "Switching..."
                    : `Switch to Sec ${secNo(alternative.section.section_number)} & Re-submit`}
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => leave.mutate({ row, kind: "leave" }, { onSuccess: () => onDone() })}
                className={cn(OPTION, "border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#f1f5f9]")}
              >
                <LogOut className="size-4 text-[#64748b]" />
                {leave.isPending ? "Leaving..." : `Leave ${row.course.code} Waitlist`}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onDone()}
                className="h-8 rounded-md text-[13px] font-medium text-[#64748b] hover:text-[#0f172a] focus-visible:outline-2 focus-visible:outline-[#ff6b00] disabled:opacity-60"
              >
                Return to Cart to Review
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
