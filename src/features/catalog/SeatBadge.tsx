import type { Section } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { isFull } from "./seats";

export function SeatBadge({ section }: { section: Section }) {
  const full = isFull(section);
  return (
    <Badge variant={full ? "destructive" : "default"} className={full ? "" : "bg-green-600"}>
      {section.enrolled_count}/{section.capacity} {full ? "FULL" : "OPEN"}
    </Badge>
  );
}

// Row action: full ? "Join Waitlist" (calls enroll(); the backend answers 409 WAITLISTED)
//                  : "Add to Cart"   (useCartStore.getState().add(section.id))
