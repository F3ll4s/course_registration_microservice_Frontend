import { http, HttpResponse } from "msw";

const b64 = (o: object) =>
  btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

// Decodable (unsigned) JWT, good enough for jwt-decode in the UI
export const fakeJwt = (sub: string) =>
  `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })}.mock`;

export const authHandlers = [
  http.post("*/api/v1/auth/login", async ({ request }) => {
    const { student_id } = (await request.json()) as { student_id: string; password: string };
    return HttpResponse.json({ access_token: fakeJwt(student_id), token_type: "bearer" });
  }),
];
