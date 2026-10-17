import { getResponse } from "msw";
import { authHandlers } from "./handlers/auth";
import { catalogHandlers } from "./handlers/catalog";
import { enrollmentHandlers, loadEnrollmentMock, saveEnrollmentMock } from "./handlers/enrollment";
import { studentHandlers } from "./handlers/student";

const handlers = [...authHandlers, ...catalogHandlers, ...enrollmentHandlers, ...studentHandlers];

// Answers matching requests inside the page by wrapping window.fetch.
// We used MSW's service worker before, but the browser stops idle workers (e.g. in a background tab)
// and the restarted worker forgot this tab, so requests went to the Vite proxy and failed with 502.
// Trade-off: mocked requests don't show in the DevTools Network tab.
export function startMocking() {
  loadEnrollmentMock(); // enrollments survive a page reload, like a real backend

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const request = new Request(input, init);
    const response = await getResponse(handlers, request.clone());
    if (!response) return realFetch(request); // not an API call, e.g. a Vite asset
    if (request.method !== "GET") saveEnrollmentMock();
    return response;
  };

  // Remove the worker an older version of the app registered, so it can't pick up requests
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    for (const r of registrations) if (r.active?.scriptURL.includes("mockServiceWorker")) r.unregister();
  });
}
