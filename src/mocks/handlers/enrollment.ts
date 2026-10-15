import { http, HttpResponse } from "msw";
import type { WaitlistEntry } from "@/api/types";
import { sections } from "./catalog";

// In-memory state for the logged-in mock student. It resets when the page reloads.
const INITIAL_ENROLLED = [105, 108, 109, 110]; // CS410, CS315, GEN201, MTH205
const INITIAL_WAITLIST: WaitlistEntry[] = [
  { offer_id: 1, section_id: 104, position: 3, status: "WAITLISTED", expires_at: null }, // CS305
];
const INITIAL_SEAT_COUNTS = new Map(sections.map((s) => [s.id, s.enrolled_count]));

const enrolled = new Set<number>(INITIAL_ENROLLED);
const waitlist: WaitlistEntry[] = INITIAL_WAITLIST.map((w) => ({ ...w }));
let nextOfferId = 2;

// Tests call this between cases so one test's enroll or drop can't leak into the next
export function resetEnrollmentMock() {
  enrolled.clear();
  INITIAL_ENROLLED.forEach((id) => enrolled.add(id));
  waitlist.splice(0, waitlist.length, ...INITIAL_WAITLIST.map((w) => ({ ...w })));
  nextOfferId = 2;
  for (const s of sections) s.enrolled_count = INITIAL_SEAT_COUNTS.get(s.id) ?? s.enrolled_count;
}

export const enrollmentHandlers = [
  http.post("*/api/v1/enrollments", async ({ request }) => {
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
  http.get("*/api/v1/enrollments/me", () =>
    HttpResponse.json([...enrolled].map((section_id) => ({ section_id, status: "ENROLLED" }))),
  ),

  http.get("*/api/v1/waitlist/me", () => HttpResponse.json(waitlist)),

  // Body confirmed by the backend team. Dropping a waitlisted section leaves the queue.
  http.post("*/api/v1/drops", async ({ request }) => {
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
