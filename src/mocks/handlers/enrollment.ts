import { jwtDecode } from "jwt-decode";
import { http, HttpResponse } from "msw";
import type { WaitlistEntry } from "@/api/types";
import { sections } from "./catalog";

// In-memory state per mock student, keyed by the JWT's student id. It resets when the page reloads.
// The demo student starts with the Penpot data; any other student id starts with nothing.
// Seat counts live on `sections`, so they are shared: one student's drop frees a seat for everyone.
export const DEMO_STUDENT = "65010042";
const DEMO_ENROLLED = [105, 108, 109, 110]; // CS410, CS315, GEN201, MTH205
const DEMO_WAITLIST: WaitlistEntry[] = [
  { offer_id: 1, section_id: 104, position: 3, status: "WAITLISTED", expires_at: null }, // CS305
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
    // In hybrid mode the real catalog may use other ids; then only 102 behaves as full
    const section = sections.find((s) => s.id === section_id);
    const full = section ? section.enrolled_count >= section.capacity : section_id === 102;

    if (full) {
      // Full section: backend answers 409 with a WAITLISTED body
      if (!waitlist.some((w) => w.section_id === section_id)) {
        waitlist.push({
          offer_id: nextOfferId++,
          section_id,
          position: 1,
          status: "WAITLISTED",
          expires_at: null,
        });
      }
      return HttpResponse.json(
        { status: "WAITLISTED", message: "Section full. Placed on waitlist." },
        { status: 409 },
      );
    }
    if (!enrolled.has(section_id)) {
      enrolled.add(section_id);
      if (section) section.enrolled_count += 1;
    }
    return HttpResponse.json(
      { status: "ENROLLED", message: "Successfully enrolled!" },
      { status: 201 },
    );
  }),

  // Paths and response shapes below are assumed until the service is connected (README section 5)
  http.get("*/api/v1/enrollments/me", ({ request }) =>
    HttpResponse.json(
      [...studentOf(request).enrolled].map((section_id) => ({ section_id, status: "ENROLLED" })),
    ),
  ),

  http.get("*/api/v1/waitlist/me", ({ request }) => HttpResponse.json(studentOf(request).waitlist)),

  // Body confirmed by the backend team. Dropping a waitlisted section leaves the queue.
  http.post("*/api/v1/drops", async ({ request }) => {
    const { enrolled, waitlist } = studentOf(request);
    const { section_id } = (await request.json()) as { section_id: number };
    if (enrolled.delete(section_id)) {
      const section = sections.find((s) => s.id === section_id);
      if (section) section.enrolled_count -= 1;
    } else {
      const i = waitlist.findIndex((w) => w.section_id === section_id);
      if (i !== -1) waitlist.splice(i, 1);
    }
    return HttpResponse.json({ status: "DROPPED" });
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
