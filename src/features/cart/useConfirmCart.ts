import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type EnrollResult, enroll } from "@/api/enrollments";
import { toUserMessage } from "@/lib/errors";
import { useCartStore } from "./store";

type Outcome = { sectionId: number; result?: EnrollResult; error?: unknown };

export function useConfirmCart() {
  const qc = useQueryClient();
  const remove = useCartStore((s) => s.remove);

  return useMutation({
    mutationFn: async (sectionIds: number[]): Promise<Outcome[]> => {
      const outcomes: Outcome[] = [];
      for (const sectionId of sectionIds) {
        try {
          outcomes.push({ sectionId, result: await enroll(sectionId) });
        } catch (error) {
          outcomes.push({ sectionId, error });
        }
      }
      return outcomes;
    },
    onSuccess: (outcomes) => {
      const status = (o: Outcome) => o.result?.status;
      for (const o of outcomes) {
        if (status(o) === "ENROLLED" || status(o) === "WAITLISTED") remove(o.sectionId);
      }
      qc.invalidateQueries({ queryKey: ["sections"] });
      qc.invalidateQueries({ queryKey: ["enrollments", "me"] });

      const enrolled = outcomes.filter((o) => status(o) === "ENROLLED").length;
      const waitlisted = outcomes.filter((o) => status(o) === "WAITLISTED").length;
      toast.success(`${enrolled} enrolled, ${waitlisted} waitlisted`);

      for (const o of outcomes.filter((x) => x.error || status(x) === "REJECTED")) {
        toast.error(o.error ? toUserMessage(o.error) : (o.result?.detail ?? "Enrollment rejected."));
      }
    },
  });
}
