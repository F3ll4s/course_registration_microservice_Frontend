import { useMutation, useQueryClient } from "@tanstack/react-query";
import { claimWaitlist, drop } from "@/api/enrollments";
import type { SectionRow } from "@/api/types";
import { notify } from "@/components/notify";
import { toUserMessage } from "@/lib/errors";
import { secNo } from "@/lib/portal";
import type { WaitlistRow } from "./useMyWaitlist";

// "drop" gives up an enrolled seat; "leave" and "decline" give up a waitlist place or a seat offer
export type DropRequest = { row: SectionRow; kind: "drop" | "leave" | "decline" };

const DONE: Record<DropRequest["kind"], (name: string) => [string, string]> = {
  drop: (name) => ["Course dropped", `${name} was dropped. Your seat goes to the next student in the queue.`],
  leave: (name) => ["Left waitlist", `You are no longer in the queue for ${name}.`],
  decline: (name) => ["Offer declined", `The seat in ${name} goes to the next student in the queue.`],
};

const sectionName = (r: SectionRow) => `${r.course.code} Sec ${secNo(r.section.section_number)}`;

// Drops an enrolled section. The same call leaves the queue (or declines the offer) for a waitlisted section.
export function useDrop() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ row }: DropRequest) => drop(row.section.id),
    onSuccess: (_, { row, kind }) => {
      qc.invalidateQueries({ queryKey: ["sections"] });
      qc.invalidateQueries({ queryKey: ["enrollments", "me"] });
      notify.success(...DONE[kind](sectionName(row)));
    },
    onError: (err) => notify.error("Drop failed", toUserMessage(err)),
  });
}

export function useClaim() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ entry }: WaitlistRow) => claimWaitlist(entry.offer_id),
    onSuccess: (result, { row }) => {
      qc.invalidateQueries({ queryKey: ["sections"] });
      qc.invalidateQueries({ queryKey: ["enrollments", "me"] });
      // The countdown is cosmetic; the server decides whether the offer is still valid
      if (result.status === "CLAIMED")
        notify.success("Seat claimed", `You are now enrolled in ${sectionName(row)} (${row.course.credits} Credits).`);
      else notify.error("Offer unavailable", result.message ?? "This offer has expired or was already claimed.");
    },
    onError: (err) => notify.error("Claim failed", toUserMessage(err)),
  });
}
