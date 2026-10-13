import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { claimWaitlist, drop } from "@/api/enrollments";
import { toUserMessage } from "@/lib/errors";

// Drops an enrolled section. The same call leaves the queue for a waitlisted section.
export function useDrop() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: drop,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sections"] });
      qc.invalidateQueries({ queryKey: ["enrollments", "me"] });
      toast.success("Section dropped.");
    },
    onError: (err) => toast.error(toUserMessage(err)),
  });
}

export function useClaim() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: claimWaitlist,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["sections"] });
      qc.invalidateQueries({ queryKey: ["enrollments", "me"] });
      // The countdown is cosmetic; the server decides whether the offer is still valid
      if (result.status === "CLAIMED") toast.success(result.message ?? "Seat claimed! You are enrolled.");
      else toast.error(result.message ?? "This offer has expired or was already claimed.");
    },
    onError: (err) => toast.error(toUserMessage(err)),
  });
}
