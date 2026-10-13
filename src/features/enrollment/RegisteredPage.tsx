import { useState } from "react";
import type { SectionRow } from "@/api/types";
import { Divider, Notice, Pill, SectionBadge } from "@/components/portal";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { toUserMessage } from "@/lib/errors";
import {
  BUTTON,
  BUTTON_DANGER,
  BUTTON_NEUTRAL,
  BUTTON_PRIMARY,
  formatSchedule,
  TABLE_HEAD,
  TABLE_ROW,
} from "@/lib/portal";
import { useCountdown } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useClaim, useDrop } from "./useDrop";
import { useEnrolledRows } from "./useMyEnrollments";
import { useWaitlistRows, type WaitlistRow } from "./useMyWaitlist";

// Column widths measured on the Penpot board (1232px wide rows)
const ENROLLED_COLUMNS = "grid grid-cols-[400fr_86fr_80fr_190fr_160fr_130fr_165fr] pl-[19px]";
const WAITLIST_COLUMNS = "grid grid-cols-[400fr_86fr_210fr_176fr_170fr_169fr] pl-[19px]";

const TITLE_BAR = "flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-lg border bg-white px-[19px] py-2";

type Pending = { row: SectionRow; kind: "drop" | "leave" };

// View 4: Registered Courses & Waitlist (Penpot "Initial Draft" > Screen 4)
export function RegisteredPage() {
  const enrolled = useEnrolledRows();
  const waitlist = useWaitlistRows();
  const drop = useDrop();
  // Dropping gives the seat away, so it always goes through a confirm step first
  const [pending, setPending] = useState<Pending | null>(null);

  const credits = enrolled.rows.reduce((sum, r) => sum + r.course.credits, 0);

  function confirmDrop() {
    if (!pending) return;
    drop.mutate(pending.row.section.id, { onSettled: () => setPending(null) });
  }

  return (
    <div className="flex flex-col">
      {/* Enrolled courses */}
      <div className={cn(TITLE_BAR, "border-[#e2e8f0]")}>
        <h1 className="text-sm font-bold text-[#0f172a]">Official Enrolled Courses | Academic Year 2026/1</h1>
        <Pill tone="green" className="px-[13px]">
          {enrolled.rows.length} Enrolled {enrolled.rows.length === 1 ? "Course" : "Courses"}
          <Divider />
          {credits} Credits
        </Pill>
      </div>

      <div className="mt-1.5 overflow-x-auto">
        <div className="min-w-[1040px]">
          <div className={cn(ENROLLED_COLUMNS, TABLE_HEAD, "h-8")}>
            <span>Course code & title</span>
            <span>Section</span>
            <span>Credits</span>
            <span>Schedule & room</span>
            <span>Instructor</span>
            <span className="pl-2.5">Status</span>
            <span className="pl-2.5">Action</span>
          </div>

          <div className="mt-1.5 flex flex-col gap-1.5">
            {enrolled.isLoading ? (
              <Notice title="Loading your courses..." className="min-h-28" />
            ) : enrolled.error ? (
              <Notice
                title="Couldn't load your enrolled courses"
                description={toUserMessage(enrolled.error)}
                className="min-h-28"
              />
            ) : enrolled.rows.length === 0 ? (
              <Notice
                title="No Enrolled Courses Yet"
                description="Courses you enroll in from the cart will appear here."
                className="min-h-28"
              />
            ) : (
              enrolled.rows.map((row) => (
                <div key={row.section.id} className={cn(ENROLLED_COLUMNS, TABLE_ROW, "h-14 rounded-md")}>
                  <div className="min-w-0 truncate pr-4 text-[13px] font-bold text-[#0f172a]">
                    {row.course.code} - {row.course.title}
                  </div>
                  <div>
                    <SectionBadge number={row.section.section_number} />
                  </div>
                  <div className="text-xs font-semibold text-[#1e293b]">{row.course.credits} Credits</div>
                  <ScheduleCell row={row} />
                  <div className="min-w-0 truncate pr-4 text-xs font-medium text-[#334155]">
                    {row.section.instructor}
                  </div>
                  <div>
                    <Pill tone="green" className="w-[100px] justify-center">
                      Enrolled
                    </Pill>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setPending({ row, kind: "drop" })}
                      className={cn(BUTTON, BUTTON_DANGER, "h-[30px] w-[120px] text-[11px]")}
                    >
                      Drop Course
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Waitlist */}
      <div className={cn(TITLE_BAR, "mt-4 border-[#fed7aa]")}>
        <h2 className="text-sm font-bold text-[#0f172a]">Active Waitlist Positions & Queue Telemetry</h2>
        <Pill tone="orange" className="border-[#ffd2b2] px-[13px] text-[#ea580c]">
          {waitlist.rows.length} Active Queue {waitlist.rows.length === 1 ? "Slot" : "Slots"}
        </Pill>
      </div>

      <div className="mt-1.5 overflow-x-auto">
        <div className="min-w-[1040px]">
          <div
            className={cn(
              WAITLIST_COLUMNS,
              TABLE_HEAD,
              "h-8 border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]",
            )}
          >
            <span>Course code & title</span>
            <span>Section</span>
            <span>Schedule & room</span>
            <span>Instructor</span>
            <span className="pl-1">Queue position & status</span>
            <span className="pl-3.5">Action</span>
          </div>

          <div className="mt-1.5 flex flex-col gap-1.5">
            {waitlist.isLoading ? (
              <Notice title="Loading your waitlist..." className="min-h-24 border-[#fed7aa]" />
            ) : waitlist.error ? (
              <Notice
                title="Couldn't load your waitlist"
                description={toUserMessage(waitlist.error)}
                className="min-h-24 border-[#fed7aa]"
              />
            ) : waitlist.rows.length === 0 ? (
              <Notice
                title="No Active Waitlist Positions"
                description="Sections you join a waitlist for will appear here with your queue position."
                className="min-h-24 border-[#fed7aa]"
              />
            ) : (
              waitlist.rows.map((w) => (
                <WaitlistRowCard
                  key={w.entry.offer_id}
                  item={w}
                  onLeave={() => setPending({ row: w.row, kind: "leave" })}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 flex min-h-12 items-center rounded-lg border border-[#ffd2b2] bg-[#fff4ed] px-[19px] py-2 text-xs font-semibold text-[#c2410c]">
        Waitlist Policy: When an enrolled student drops a section, Position #1 is immediately offered the
        vacancy. Claim the seat before the offer expires.
      </p>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent className="gap-4 rounded-2xl p-6 sm:max-w-[480px]">
          <DialogTitle className="text-base font-bold text-[#0f172a]">
            {pending?.kind === "leave" ? "Leave Waitlist?" : "Confirm Course Drop"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#475569]">
            {pending?.kind === "leave"
              ? "Are you sure you want to leave the waitlist for:"
              : "Are you sure you want to drop:"}
          </DialogDescription>
          {pending && (
            <p className="text-sm font-bold text-[#0f172a]">
              {pending.row.course.code} • {pending.row.course.title} (Section{" "}
              {pending.row.section.section_number})
            </p>
          )}
          <p className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-3.5 py-3 text-xs font-semibold text-[#991b1b]">
            {pending?.kind === "leave"
              ? "Warning: You will lose your place in the queue. You cannot undo this."
              : "Warning: Your seat will immediately be released to students waiting in the queue. You cannot undo this."}
          </p>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setPending(null)}
              className={cn(BUTTON, BUTTON_NEUTRAL, "h-10 px-4")}
            >
              {pending?.kind === "leave" ? "Stay on Waitlist" : "Keep My Seat"}
            </button>
            <button
              type="button"
              disabled={drop.isPending}
              onClick={confirmDrop}
              className={cn(BUTTON, "h-10 bg-[#dc2626] px-4 text-white hover:bg-[#b91c1c]")}
            >
              {drop.isPending
                ? "Working..."
                : pending?.kind === "leave"
                  ? "Yes, Leave Waitlist"
                  : "Yes, Drop Course"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScheduleCell({ row }: { row: SectionRow }) {
  return (
    <div className="min-w-0 pr-4">
      <div className="truncate text-xs leading-[15px] font-semibold text-[#1e293b]">
        {formatSchedule(row.section)}
      </div>
      <div className="mt-[3px] truncate text-[11px] leading-[14px] font-medium text-[#ea580c]">
        Room: {row.section.room}
      </div>
    </div>
  );
}

function WaitlistRowCard({ item, onLeave }: { item: WaitlistRow; onLeave: () => void }) {
  const { entry, row } = item;
  const claim = useClaim();
  const offered = entry.status === "OFFERED";
  const ahead = entry.position - 1;

  return (
    <div className={cn(WAITLIST_COLUMNS, TABLE_ROW, "h-[66px] rounded-md border-[#fed7aa]")}>
      <div className="min-w-0 truncate pr-4 text-[13px] font-bold text-[#0f172a]">
        {row.course.code} - {row.course.title}
      </div>
      <div>
        <SectionBadge number={row.section.section_number} />
      </div>
      <ScheduleCell row={row} />
      <div className="min-w-0 truncate pr-4 text-xs font-medium text-[#334155]">{row.section.instructor}</div>

      <div className="min-w-0">
        <Pill
          tone={offered || entry.position === 1 ? "solid" : "orange"}
          className={cn("min-w-[154px]", !offered && entry.position !== 1 && "border-[#ffd2b2]")}
        >
          {offered ? "Seat offered to you" : `Position: #${entry.position} in queue`}
        </Pill>
        <div className="mt-[5px] truncate text-[10px] leading-3 font-medium text-[#64748b]">
          {offered ? (
            entry.expires_at ? (
              <OfferCountdown expiresAt={entry.expires_at} />
            ) : (
              "Claim it before the offer expires"
            )
          ) : ahead === 0 ? (
            "Next in line when a seat opens"
          ) : (
            `${ahead} ${ahead === 1 ? "student" : "students"} ahead in waitlist queue`
          )}
        </div>
      </div>

      <div className="flex gap-2 pr-2">
        {offered ? (
          <button
            type="button"
            disabled={claim.isPending}
            onClick={() => claim.mutate(entry.offer_id)}
            className={cn(BUTTON, BUTTON_PRIMARY, "h-[30px] w-[124px] text-[11px]")}
          >
            {claim.isPending ? "Claiming..." : "Claim Seat"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onLeave}
            className={cn(BUTTON, BUTTON_NEUTRAL, "h-[30px] w-[124px] text-[11px]")}
          >
            Leave Waitlist
          </button>
        )}
      </div>
    </div>
  );
}

function OfferCountdown({ expiresAt }: { expiresAt: string }) {
  const left = useCountdown(expiresAt);
  if (left === 0) return <>Offer expired</>;
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  return (
    <>
      Claim within {h}h {String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s
    </>
  );
}
