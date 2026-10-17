import { jwtDecode } from "jwt-decode";
import { http, HttpResponse } from "msw";
import type { WaitlistEntry } from "@/api/types";
import { sections } from "./catalog";

// In-memory state per mock student, keyed by the JWT's student id. In the browser it is saved to
// sessionStorage (see saveEnrollmentMock), so it survives a reload and resets when the tab is closed.
// The demo student starts with the Penpot data; any other student id starts with nothing.
// Seat counts live on `sections`, so they are shared: one student's drop frees a seat for everyone.
export const DEMO_STUDENT = "STU_001";
const DEMO_ENROLLED = [105, 108, 109, 110]; // CS410, CS315, GEN201, MTH205
const DEMO_WAITLIST: WaitlistEntry[] = [
  { offer_id: 1, section_id: 104, course_code: "CS305", position: 3, status: "WAITLISTED", expires_at: null },
];
const INITIAL_SEAT_COUNTS = new Map(sections.map((s) => [s.id, s.enrolled_count]));

type StudentState = { enrolled: Set<number>; waitlist: WaitlistEntry[] };

const students = new Map<string, StudentState>();
let nextOfferId = 2;

function stateOf(studentId: string): StudentState {
  let state = students.get(studentId);
  if (!state) {
    const demo = studentId === DEMO_STUDENT;
    state = {
      enrolled: new Set(demo ? DEMO_ENROLLED : []),
      waitlist: demo ? DEMO_WAITLIST.map((w) => ({ ...w })) : [],
    };
    students.set(studentId, state);
  }
  return state;
}

// Like the real gateway, identity comes from the bearer token. No token falls back to the demo student.
function studentOf(request: Request): StudentState {
  const token = request.headers.get("Authorization")?.replace(/^Bearer /, "");
  try {
    return stateOf(token ? jwtDecode<{ sub: string }>(token).sub : DEMO_STUDENT);
  } catch {
    return stateOf(DEMO_STUDENT);
  }
}

// Tests call this between cases so one test's enroll or drop can't leak into the next
export function resetEnrollmentMock() {
  students.clear();
  nextOfferId = 2;
  for (const s of sections) s.enrolled_count = INITIAL_SEAT_COUNTS.get(s.id) ?? s.enrolled_count;
}

const STORAGE_KEY = "mock-backend";

type SavedState = {
  students: Record<string, { enrolled: number[]; waitlist: WaitlistEntry[] }>;
  seats: Record<number, number>;
  nextOfferId: number;
};

// Browser only (src/mocks/browser.ts): called after every mocked POST
export function saveEnrollmentMock() {
  const saved: SavedState = {
    students: Object.fromEntries(
      [...students].map(([id, s]) => [id, { enrolled: [...s.enrolled], waitlist: s.waitlist }]),
    ),
    seats: Object.fromEntries(sections.map((s) => [s.id, s.enrolled_count])),
    nextOfferId,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

export function loadEnrollmentMock() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw) as SavedState;
    students.clear();
    for (const [id, s] of Object.entries(saved.students)) {
      students.set(id, { enrolled: new Set(s.enrolled), waitlist: s.waitlist });
    }
    for (const s of sections) s.enrolled_count = saved.seats[s.id] ?? s.enrolled_count;
    nextOfferId = saved.nextOfferId;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY); // unreadable: start from the demo data
  }
}

// Simulates another student dropping: the student's place in that queue becomes a seat offer
export function offerWaitlistSeat(sectionId: number, hoursToClaim = 24, studentId = DEMO_STUDENT) {
  const entry = stateOf(studentId).waitlist.find((w) => w.section_id === sectionId);
  if (!entry) return;
  entry.status = "OFFERED";
  entry.position = 1;
  entry.expires_at = new Date(Date.now() + hoursToClaim * 3_600_000).toISOString();
}

export const enrollmentHandlers = [
  http.post("*/api/v1/enrollments", async ({ request }) => {
    const { enrolled, waitlist } = studentOf(request);
    const { section_id } = (await request.json()) as { section_id: number };
    const section = sections.find((s) => s.id === section_id);
    if (!section) return HttpResponse.json({ detail: `Section ${section_id} not found.` }, { status: 404 });
    if (enrolled.has(section_id) || waitlist.some((w) => w.section_id === section_id)) {
      return HttpResponse.json({ detail: `Already enrolled or waitlisted in section ${section_id}.` }, { status: 409 });
    }

    if (section.enrolled_count >= section.capacity) {
      // Full section: backend answers 409 with a WAITLISTED body
      waitlist.push({
        offer_id: nextOfferId++,
        section_id,
        course_code: section.course_code,
        position: 1,
        status: "WAITLISTED",
        expires_at: null,
      });
      return HttpResponse.json(
        { status: "WAITLISTED", message: "Section full. Placed on waitlist.", waitlist_position: 1 },
        { status: 409 },
      );
    }
    enrolled.add(section_id);
    section.enrolled_count += 1;
    return HttpResponse.json(
      { status: "ENROLLED", message: "Successfully enrolled!" },
      { status: 201 },
    );
  }),

  // The real list also has DROPPED/REJECTED history, schedule and timestamps; the UI only reads these
  http.get("*/api/v1/enrollments/me", ({ request }) =>
    HttpResponse.json(
      [...studentOf(request).enrolled].map((section_id) => ({
        enrollment_id: section_id,
        section_id,
        course_code: sections.find((s) => s.id === section_id)?.course_code,
        status: "ENROLLED",
      })),
    ),
  ),

  http.get("*/api/v1/waitlist/me", ({ request }) => HttpResponse.json(studentOf(request).waitlist)),

  // Drops a section, or leaves its waitlist / declines its offer. 404 when there is nothing to drop.
  http.post("*/api/v1/drops", async ({ request }) => {
    const { enrolled, waitlist } = studentOf(request);
    const { section_id } = (await request.json()) as { section_id: number };
    if (enrolled.delete(section_id)) {
      const section = sections.find((s) => s.id === section_id);
      if (section) section.enrolled_count -= 1;
      return HttpResponse.json({ status: "DROPPED", message: `Dropped section ${section_id}.` });
    }
    const i = waitlist.findIndex((w) => w.section_id === section_id);
    if (i === -1) {
      return HttpResponse.json({ detail: `No active enrollment for section ${section_id}.` }, { status: 404 });
    }
    waitlist.splice(i, 1);
    return HttpResponse.json({ status: "DROPPED", message: `Removed from the waitlist for section ${section_id}.` });
  }),

  http.post("*/api/v1/waitlist/claim", async ({ request }) => {
    const { enrolled, waitlist } = studentOf(request);
    const { offer_id } = (await request.json()) as { offer_id: number };
    const i = waitlist.findIndex((w) => w.offer_id === offer_id && w.status === "OFFERED");
    if (i === -1) {
      return HttpResponse.json({
        status: "EXPIRED_OR_ALREADY_CLAIMED",
        message: "This offer is no longer available.",
      });
    }
    enrolled.add(waitlist[i].section_id);
    waitlist.splice(i, 1);
    return HttpResponse.json({ status: "CLAIMED", message: "Seat claimed! You are enrolled." });
  }),
];
