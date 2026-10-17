import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { createMemoryRouter, type RouteObject, RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { useAuthStore } from "@/features/auth/store";
import { fakeJwt } from "@/mocks/handlers/auth";

// Renders a route table the same way the app does (React Query + router + toasts), starting at `path`
export function renderRoutes(routes: RouteObject[], path = "/") {
  // A fresh cache per test, and no retries so error states show up immediately
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  return {
    router,
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>,
    ),
  };
}

// Renders a single page; any route shows it, so links inside the page still work
export const renderPage = (page: ReactElement) => renderRoutes([{ path: "*", element: page }]);

// Puts a valid mock token in the auth store, as if the student had just logged in
export function logIn(studentId = "STU_001") {
  useAuthStore.getState().login(fakeJwt(studentId));
}
