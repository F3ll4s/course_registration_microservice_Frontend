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

export type PrereqRequest = {
  student_id: string;
  course_code: string;
  completed_courses: string[];
};

export type PrereqResult = {
  is_valid: boolean;
  missing_prereqs: string[];
  message: string;
};

/** A section joined with its course. Sections carry no title or credits, so every view renders this. */
export type SectionRow = { section: Section; course: Course };

// The three shapes below are not confirmed by the backend team yet (README section 5, requests 1 to 3).
// They are what the UI needs; adjust them here once the real endpoints exist.

export type Enrollment = {
  section_id: number;
  status: "STAGED" | "OFFERED" | "ENROLLED" | "DROPPED" | "WAITLISTED";
};

export type WaitlistEntry = {
  offer_id: number;
  section_id: number;
  position: number; // 1 = next in line
  status: "WAITLISTED" | "OFFERED";
  expires_at: string | null; // set once a seat is offered
};

export type Student = { student_id: string; completed_courses: string[] };
