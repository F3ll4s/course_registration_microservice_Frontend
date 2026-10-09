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
