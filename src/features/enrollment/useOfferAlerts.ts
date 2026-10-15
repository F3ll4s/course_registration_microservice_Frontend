import { useEffect, useRef } from "react";
import { notify } from "@/components/notify";
import { secNo } from "@/lib/portal";
import { formatHoursMinutes, secondsLeft } from "@/lib/time";
import { useWaitlistRows } from "./useMyWaitlist";

// Pops a "Waitlist offer available" toast (Penpot "Design #1" toast matrix) the first time
// each seat offer shows up, whichever page the student is on. Claiming happens on the Registered page.
export function useOfferAlerts() {
  const { rows } = useWaitlistRows();
  const shown = useRef(new Set<number>());

  useEffect(() => {
    for (const { entry, row } of rows) {
      if (entry.status !== "OFFERED" || shown.current.has(entry.offer_id)) continue;
      shown.current.add(entry.offer_id);

      const deadline = entry.expires_at
        ? `Claim within ${formatHoursMinutes(secondsLeft(entry.expires_at))}.`
        : "Claim it before the offer expires.";
      notify.waitlist(
        "Waitlist offer available",
        `A seat opened for ${row.course.code} Sec ${secNo(row.section.section_number)}! ${deadline}`,
        { duration: 10_000 },
      );
    }
  }, [rows]);
}
