import type { Section } from "@/api/types";
import { cn } from "@/lib/utils";
import { isFull } from "./seats";

// Seat status pill from the Penpot catalog screen: green OPEN, red FULL
export function SeatBadge({ section }: { section: Section }) {
  const full = isFull(section);
  return (
    <span
      className={cn(
        "inline-flex h-7 w-[120px] items-center rounded-full border px-[15px] text-[11px] font-bold whitespace-nowrap",
        full
          ? "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]"
          : "border-[#a7f3d0] bg-[#ecfdf5] text-[#047857]",
      )}
    >
      {section.enrolled_count}/{section.capacity} {full ? "FULL" : "OPEN"}
    </span>
  );
}

// Row action: full ? "Join Waitlist" (calls enroll(); the backend answers 409 WAITLISTED)
//                  : "Add to Cart"   (useCartStore.getState().add(section.id))
