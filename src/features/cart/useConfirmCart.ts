import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type EnrollResult, enroll } from "@/api/enrollments";
import type { SectionRow } from "@/api/types";
import { notify } from "@/components/notify";
import { toUserMessage } from "@/lib/errors";
import { secNo } from "@/lib/portal";
import { useCartStore } from "./store";

export type Outcome = { row: SectionRow; result?: EnrollResult; error?: unknown };

const sectionName = (r: SectionRow) => `${r.course.code} Sec ${secNo(r.section.section_number)}`;

// Enrolls each staged section in turn. A section that filled up meanwhile comes back WAITLISTED:
// the backend has already queued the student, and the cart page offers what to do next.
export function useConfirmCart() {
  const qc = useQueryClient();
  const remove = useCartStore((s) => s.remove);

  return useMutation({
    mutationFn: async (rows: SectionRow[]): Promise<Outcome[]> => {
      const outcomes: Outcome[] = [];
      for (const row of rows) {
        try {
          outcomes.push({ row, result: await enroll(row.section.id) });
        } catch (error) {
          outcomes.push({ row, error });
        }
      }
      return outcomes;
    },
    onSuccess: (outcomes) => {
      const status = (o: Outcome) => o.result?.status;
      for (const o of outcomes) {
        if (status(o) === "ENROLLED" || status(o) === "WAITLISTED") remove(o.row.section.id);
      }
      qc.invalidateQueries({ queryKey: ["sections"] });
      qc.invalidateQueries({ queryKey: ["enrollments", "me"] });

      const enrolled = outcomes.filter((o) => status(o) === "ENROLLED").map((o) => o.row);
      if (enrolled.length) {
        const credits = enrolled.reduce((sum, r) => sum + r.course.credits, 0);
        notify.success(
          "Enrollment successful",
          `Successfully registered for ${enrolled.map(sectionName).join(", ")} (${credits} Credits).`,
        );
      }

      for (const o of outcomes.filter((x) => x.error || status(x) === "REJECTED")) {
        notify.error(
          `${sectionName(o.row)} not enrolled`,
          o.error ? toUserMessage(o.error) : (o.result?.detail ?? "Enrollment rejected."),
        );
      }
    },
  });
}
