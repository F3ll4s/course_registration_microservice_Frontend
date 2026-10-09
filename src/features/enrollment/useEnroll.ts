import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { enroll } from "@/api/enrollments";
import { toUserMessage } from "@/lib/errors";

export function useEnroll() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: enroll,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["sections"] });
      qc.invalidateQueries({ queryKey: ["enrollments", "me"] });

      if (result.status === "ENROLLED") toast.success("You are enrolled!");
      else if (result.status === "WAITLISTED")
        toast.info("Section is full. You were added to the waitlist.");
      else toast.error(result.detail ?? "Enrollment was rejected.");
    },
    onError: (err) => toast.error(toUserMessage(err)),
  });
}

// Usage:  <Button disabled={enroll.isPending} onClick={() => enroll.mutate(section.id)}>Enroll</Button>
