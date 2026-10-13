// Vitest: everything is mocked
import { setupServer } from "msw/node";
import { authHandlers } from "./handlers/auth";
import { catalogHandlers } from "./handlers/catalog";
import { enrollmentHandlers } from "./handlers/enrollment";
import { studentHandlers } from "./handlers/student";

export const server = setupServer(
  ...authHandlers,
  ...catalogHandlers,
  ...enrollmentHandlers,
  ...studentHandlers,
);
