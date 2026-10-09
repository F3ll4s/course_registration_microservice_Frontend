import { setupWorker } from "msw/browser";
import { authHandlers } from "./handlers/auth";
import { catalogHandlers } from "./handlers/catalog";
import { enrollmentHandlers } from "./handlers/enrollment";

const gatewayHandlers = [...authHandlers, ...enrollmentHandlers];

// hybrid: only the gateway is mocked, /catalog/* goes through to the real service on :8002
// mock:   catalog is mocked too
export const worker = setupWorker(
  ...gatewayHandlers,
  ...(import.meta.env.MODE === "mock" ? catalogHandlers : []),
);
