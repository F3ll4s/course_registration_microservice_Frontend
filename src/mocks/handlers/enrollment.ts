import { http, HttpResponse } from "msw";

export const enrollmentHandlers = [
  http.post("*/api/v1/enrollments", async ({ request }) => {
    const { section_id } = (await request.json()) as { section_id: number };

    if (section_id === 102) {
      // Full section: backend answers 409 with a WAITLISTED body
      return HttpResponse.json(
        { status: "WAITLISTED", message: "Section full. Placed on waitlist." },
        { status: 409 },
      );
    }
    return HttpResponse.json(
      { status: "ENROLLED", message: "Successfully enrolled!" },
      { status: 201 },
    );
  }),

  // Body confirmed by the backend team; response shapes are assumed until the service is connected
  http.post("*/api/v1/drops", () => HttpResponse.json({ status: "DROPPED" })),
  http.post("*/api/v1/waitlist/claim", () =>
    HttpResponse.json({ status: "CLAIMED", message: "Seat claimed! You are enrolled." }),
  ),
];
