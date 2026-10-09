export type EnrollmentStatus = "STAGED" | "OFFERED" | "ENROLLED" | "DROPPED" | "WAITLISTED";

export const STATUS_UI: Record<
  EnrollmentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; canDrop: boolean }
> = {
  STAGED: { label: "Pending", variant: "secondary", canDrop: false },
  OFFERED: { label: "Seat offered", variant: "default", canDrop: false },
  ENROLLED: { label: "Enrolled", variant: "default", canDrop: true },
  DROPPED: { label: "Dropped", variant: "outline", canDrop: false },
  WAITLISTED: { label: "Waitlisted", variant: "secondary", canDrop: true },
};
