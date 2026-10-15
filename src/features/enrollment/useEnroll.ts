import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enroll } from "@/api/enrollments";
import { notify } from "@/components/notify";
import { toUserMessage } from "@/lib/errors";

export function useEnroll() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: enroll,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["sections"] });
      qc.invalidateQueries({ queryKey: ["enrollments", "me"] });

      if (result.status === "ENROLLED") notify.success("Enrollment successful", "You are enrolled!");
      else if (result.status === "WAITLISTED")
        notify.waitlist("Added to waitlist", "Section is full. You were added to the waitlist.");
      else notify.error("Enrollment rejected", result.detail ?? "Enrollment was rejected.");
    },
    onError: (err) => notify.error("Enrollment failed", toUserMessage(err)),
  });
}

// Usage:  <Button disabled={enroll.isPending} onClick={() => enroll.mutate(section.id)}>Enroll</Button>
