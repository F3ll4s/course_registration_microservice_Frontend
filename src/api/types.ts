export type Day = "MON" | "TUE" | "WED" | "THU" | "FRI";

export type Course = {
  code: string; // "CS301"
  title: string;
  credits: number;
  prerequisites: string[]; // course codes
};

export type Section = {
  id: number;
  course_code: string; // joins to Course.code
  section_number: number;
  capacity: number;
  enrolled_count: number;
  schedule_days: Day[];
  start_time: string; // "09:00" (24h)
  end_time: string; // "10:30"
  room: string;
  instructor: string;
};

// Worked out in the browser (checkPrereqs in features/cart/rules.ts); the gateway doesn't expose
// the catalog's validate-prereqs endpoint. The backend checks prerequisites again on enroll.
export type PrereqResult = {
  is_valid: boolean;
  missing_prereqs: string[];
  message: string;
};

/** A section joined with its course. Sections carry no title or credits, so every view renders this. */
export type SectionRow = { section: Section; course: Course };

// Shapes from the backend (Tock15/course_registration_microservice, enrollment_service/schemas.py
// and common/schemas.py). Only the fields the UI reads are listed.

// GET /enrollments/me returns every record, including DROPPED and REJECTED history
export type Enrollment = {
  enrollment_id: number;
  section_id: number;
  course_code: string;
  status: "STAGED" | "ENROLLED" | "WAITLISTED" | "OFFERED" | "DROPPED" | "REJECTED";
};

export type WaitlistEntry = {
  offer_id: number; // pass to POST /waitlist/claim
  section_id: number;
  course_code: string;
  position: number; // 1 = next in line, and 1 while OFFERED
  status: "WAITLISTED" | "OFFERED";
  expires_at: string | null; // claim deadline (UTC) once a seat is offered
};

// GET /students/me
export type Student = {
  id: string; // "STU_001"
  name: string;
  completed_courses: string[];
  enrolled_credits: number;
  max_credits: number;
};
