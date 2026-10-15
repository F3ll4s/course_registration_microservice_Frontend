import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { useAuthStore } from "@/features/auth/store";
import { useCartStore } from "@/features/cart/store";
import { resetEnrollmentMock } from "@/mocks/handlers/enrollment";
import { server } from "@/mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  // Every test starts logged out, with an empty cart and the mock backend's starting data
  resetEnrollmentMock();
  useCartStore.setState({ sectionIds: [] });
  useAuthStore.setState({ token: null, studentId: null });
  sessionStorage.clear();
});
afterAll(() => server.close());
