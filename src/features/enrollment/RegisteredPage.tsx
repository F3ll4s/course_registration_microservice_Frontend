import { Clock, LogOut, Timer, Trash2, TriangleAlert, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { CodeChip, Pill } from "@/components/portal";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { toUserMessage } from "@/lib/errors";
import {
  BUTTON,
  BUTTON_DANGER,
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  formatSchedule,
  secNo,
} from "@/lib/portal";
import { formatHoursMinutes, useCountdown } from "@/lib/time";
import { cn } from "@/lib/utils";
import { type DropRequest, useClaim, useDrop } from "./useDrop";
import { useEnrolledRows } from "./useMyEnrollments";
import { useWaitlistRows, type WaitlistRow } from "./useMyWaitlist";

// Column widths measured on the Penpot board (1392px wide tables, 24px side padding, 16px gaps)
const ENROLLED_COLUMNS = "grid grid-cols-[90fr_410fr_70fr_70fr_300fr_130fr_178fr] items-center gap-x-4 px-6";
const WAITLIST_COLUMNS = "grid grid-cols-[90fr_410fr_70fr_70fr_150fr_280fr_178fr] items-center gap-x-4 px-6";

const TABLE_CARD = "overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.08)]";
const TABLE_TITLE = "flex h-[52px] items-center border-b border-[#e2e8f0] px-6 text-base font-bold text-[#0f172a] uppercase";
const TABLE_HEAD = "h-[38px] border-b border-[#e2e8f0] bg-[#f1f5f9] text-xs font-semibold text-[#64748b]";
const TABLE_ROW = "min-h-14 border-b border-[#e2e8f0] py-2.5 last:border-b-0";
const CELL = "truncate text-[13px] text-[#475569]";

// Wording of the confirm dialog for each way of giving up a seat or a place in the queue
const CONFIRM_COPY: Record<
  DropRequest["kind"],
  { title: string; question: string; warning: string; keep: string; yes: string; busy: string }
> = {
  drop: {
    title: "Confirm Course Drop",
    question: "Are you sure you want to drop this course from your enrolled schedule?",
    warning: "Warning: Your seat will immediately be released to students waiting in the queue.",
    keep: "Keep My Seat",
    yes: "Yes, Drop Course",
    busy: "Dropping...",
  },
  leave: {
    title: "Leave Waitlist",
    question: "Are you sure you want to leave the waitlist for this section?",
    warning: "Warning: You will lose your place in the queue. You cannot undo this.",
    keep: "Stay on Waitlist",
    yes: "Yes, Leave Waitlist",
    busy: "Leaving...",
  },
  decline: {
    title: "Decline Seat Offer",
    question: "Are you sure you want to decline the seat offered to you in this section?",
    warning: "Warning: The seat will be offered to the next student in the queue. You cannot undo this.",
    keep: "Keep Offer",
    yes: "Yes, Decline Offer",
    busy: "Declining...",
  },
};

// Penpot "Design #1" > Desktop - Registered & Waitlist Dashboard
export function RegisteredPage() {
  const enrolled = useEnrolledRows();
  const waitlist = useWaitlistRows();
  const drop = useDrop();
  // Dropping gives the seat away, so it always goes through a confirm step first
  const [pending, setPending] = useState<DropRequest | null>(null);
  const copy = CONFIRM_COPY[pending?.kind ?? "drop"];

  const credits = enrolled.rows.reduce((sum, r) => sum + r.course.credits, 0);
  const offers = waitlist.rows.filter((w) => w.entry.status === "OFFERED");

  function confirmDrop() {
    if (!pending) return;
    drop.mutate(pending, { onSettled: () => setPending(null) });
  }

  return (
    <div className="flex flex-col gap-6">
      {offers.map((item) => (
        <OfferBanner
          key={item.entry.offer_id}
          item={item}
          onDecline={() => setPending({ row: item.row, kind: "decline" })}
        />
      ))}

      <section aria-label="Enrolled courses" className={TABLE_CARD}>
        <h1 className={TABLE_TITLE}>Confirmed Enrolled Courses ({credits} Credits)</h1>
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
            <div className={cn(ENROLLED_COLUMNS, TABLE_HEAD)}>
              <span>Code</span>
              <span>Course Title</span>
              <span>Sec</span>
              <span>Credits</span>
              <span>Schedule</span>
              <span>Room</span>
              <span className="text-right">Action</span>
            </div>
            {enrolled.isLoading ? (
              <EmptyRow>Loading your courses...</EmptyRow>
            ) : enrolled.error ? (
              <EmptyRow>Couldn't load your enrolled courses: {toUserMessage(enrolled.error)}</EmptyRow>
            ) : enrolled.rows.length === 0 ? (
              <EmptyRow>No enrolled courses yet. Courses you enroll in from the cart will appear here.</EmptyRow>
            ) : (
              enrolled.rows.map((row) => (
                <div key={row.section.id} className={cn(ENROLLED_COLUMNS, TABLE_ROW)}>
                  <CodeChip code={row.course.code} className="h-7 w-[74px] text-xs" />
                  <span className="truncate text-sm font-semibold text-[#0f172a]">{row.course.title}</span>
                  <span className={CELL}>Sec {secNo(row.section.section_number)}</span>
                  <span className={CELL}>{row.course.credits} Cr</span>
                  <span className={cn(CELL, "text-[#0f172a]")}>{formatSchedule(row.section)}</span>
                  <span className={CELL}>{row.section.room}</span>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setPending({ row, kind: "drop" })}
                      className={cn(BUTTON, BUTTON_DANGER, "w-[150px] [&_svg]:text-[#f59e0b] hover:[&_svg]:text-white")}
                    >
                      Drop Course
                      <TriangleAlert />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section aria-label="Waitlist" className={TABLE_CARD}>
        <h2 className={TABLE_TITLE}>
          Active Waitlist Queues ({waitlist.rows.length} {waitlist.rows.length === 1 ? "Section" : "Sections"} Pending)
        </h2>
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
            <div className={cn(WAITLIST_COLUMNS, TABLE_HEAD)}>
              <span>Code</span>
              <span>Course Title</span>
              <span>Sec</span>
              <span>Credits</span>
              <span>Queue Rank</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>
            {waitlist.isLoading ? (
              <EmptyRow>Loading your waitlist...</EmptyRow>
            ) : waitlist.error ? (
              <EmptyRow>Couldn't load your waitlist: {toUserMessage(waitlist.error)}</EmptyRow>
            ) : waitlist.rows.length === 0 ? (
              <EmptyRow>No active waitlist queues. Full sections you join will appear here with your rank.</EmptyRow>
            ) : (
              waitlist.rows.map((w) => (
                <WaitlistLine
                  key={w.entry.offer_id}
                  item={w}
                  onLeave={() => setPending({ row: w.row, kind: "leave" })}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Penpot "Design #1" > Overlay - Course Drop Modal */}
      <Dialog open={pending !== null} onOpenChange={(open) => !open && !drop.isPending && setPending(null)}>
        <DialogContent showCloseButton={false} className="gap-0 rounded-2xl bg-white p-6 sm:max-w-[480px]">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-base font-bold text-[#0f172a] uppercase">{copy.title}</DialogTitle>
            <DialogClose
              aria-label="Close"
              disabled={drop.isPending}
              className="flex size-8 items-center justify-center rounded-md bg-[#f1f5f9] text-[#64748b] outline-none hover:text-[#0f172a] focus-visible:ring-2 focus-visible:ring-[#ff5722]/40"
            >
              <X className="size-4" />
            </DialogClose>
          </div>
          <DialogDescription className="mt-4 text-[13px] text-[#475569]">{copy.question}</DialogDescription>
          {pending && (
            <p className="mt-4 flex min-h-10 items-center rounded-md border border-[#e2e8f0] bg-[#f1f5f9] px-3 py-2 text-[13px] font-bold text-[#0f172a]">
              {pending.row.course.code} • {pending.row.course.title} (Section {secNo(pending.row.section.section_number)})
            </p>
          )}
          <p className="mt-4 flex min-h-[52px] items-center gap-2.5 rounded-md border border-[#ef4444] bg-[#fef2f2] px-3 py-2 text-xs text-[#b91c1c]">
            <TriangleAlert aria-hidden className="size-4 shrink-0 text-[#f59e0b]" />
            {copy.warning}
          </p>
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              disabled={drop.isPending}
              onClick={() => setPending(null)}
              className={cn(BUTTON, BUTTON_SECONDARY, "h-11 px-5 text-[13px]")}
            >
              {copy.keep}
            </button>
            <button
              type="button"
              disabled={drop.isPending}
              onClick={confirmDrop}
              className={cn(BUTTON, "h-11 bg-[#ef4444] px-5 text-[13px] text-white hover:bg-[#dc2626] active:bg-[#b91c1c]")}
            >
              {pending?.kind === "leave" ? <LogOut /> : <Trash2 />}
              {drop.isPending ? copy.busy : copy.yes}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="px-6 py-5 text-[13px] text-[#64748b]">{children}</p>;
}

function WaitlistLine({ item, onLeave }: { item: WaitlistRow; onLeave: () => void }) {
  const { entry, row } = item;
  const claim = useClaim();
  const offered = entry.status === "OFFERED";

  return (
    <div className={cn(WAITLIST_COLUMNS, TABLE_ROW)}>
      <CodeChip code={row.course.code} className="h-7 w-[74px] text-xs" />
      <span className="truncate text-sm font-semibold text-[#0f172a]">{row.course.title}</span>
      <span className={CELL}>Sec {secNo(row.section.section_number)}</span>
      <span className={CELL}>{row.course.credits} Cr</span>
      <span>
        <Pill tone="amber" className="w-[110px] text-xs font-semibold">
          #{entry.position} in line
        </Pill>
      </span>
      <div className="flex min-w-0 items-center gap-2.5">
        {offered ? (
          <>
            <Pill tone="orange" className="w-[164px] text-xs font-semibold">
              OFFER PENDING
              <Timer />
            </Pill>
            {entry.expires_at && <OfferCountdown expiresAt={entry.expires_at} />}
          </>
        ) : (
          <Pill tone="amber" className="w-[164px] text-xs font-semibold">
            IN QUEUE
            <Clock />
          </Pill>
        )}
      </div>
      <div className="flex justify-end">
        {offered ? (
          <button
            type="button"
            disabled={claim.isPending}
            onClick={() => claim.mutate(item)}
            className={cn(BUTTON, BUTTON_PRIMARY, "w-[150px]")}
          >
            {claim.isPending ? "Claiming..." : "Claim Seat"}
          </button>
        ) : (
          <button type="button" onClick={onLeave} className={cn(BUTTON, BUTTON_SECONDARY, "w-[150px]")}>
            Leave Waitlist
          </button>
        )}
      </div>
    </div>
  );
}

// Penpot "Design #1" > Registered & Waitlist Dashboard > OfferBanner - Waitlist Promotion
function OfferBanner({ item, onDecline }: { item: WaitlistRow; onDecline: () => void }) {
  const { entry, row } = item;
  const claim = useClaim();

  return (
    <div className="flex min-h-[68px] flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-[10px] border border-[#ff5722] bg-[#fff3e0] px-6 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-8 items-center rounded-full bg-[#ff5722] px-5 text-xs font-bold text-white">
          🎉 OFFER READY
        </span>
        <p className="text-sm font-bold text-[#0f172a]">
          Seat offer available for {row.course.code} Section {secNo(row.section.section_number)}!{" "}
          {entry.expires_at ? <ReservationLeft expiresAt={entry.expires_at} /> : "Claim it before the offer expires."}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecline}
          disabled={claim.isPending}
          className={cn(BUTTON, BUTTON_GHOST, "h-9 w-20 text-sm text-[#475569]")}
        >
          Decline
        </button>
        <button
          type="button"
          disabled={claim.isPending}
          onClick={() => claim.mutate(item)}
          className={cn(BUTTON, BUTTON_PRIMARY, "h-10 w-[146px] text-[13px]")}
        >
          {claim.isPending ? "Claiming..." : "Claim Seat Now"}
        </button>
      </div>
    </div>
  );
}

function ReservationLeft({ expiresAt }: { expiresAt: string }) {
  const left = useCountdown(expiresAt);
  return <>{left === 0 ? "This offer has expired." : `Reservation expires in ${formatHoursMinutes(left)}.`}</>;
}

function OfferCountdown({ expiresAt }: { expiresAt: string }) {
  const left = useCountdown(expiresAt);
  return (
    <span className="truncate text-[11px] font-medium text-[#64748b]">
      {left === 0 ? "Offer expired" : `Claim within ${formatHoursMinutes(left)}`}
    </span>
  );
}
