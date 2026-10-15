import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProtectedRoute } from "@/app/ProtectedRoute";
import { useAuthStore } from "@/features/auth/store";
import { logIn, renderRoutes } from "@/test/render";
import { AppLayout } from "./AppLayout";

// The same nesting as AppRouter, with simple stand-ins for the pages
const routes = [
  { path: "/login", element: <h1>Login page</h1> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/catalog", element: <h1>Catalog page</h1> },
          { path: "/timetable", element: <h1>Timetable page</h1> },
        ],
      },
    ],
  },
];

describe("ProtectedRoute and AppLayout", () => {
  it("sends a logged-out student to the login page", async () => {
    renderRoutes(routes, "/catalog");
    expect(await screen.findByRole("heading", { name: "Login page" })).toBeInTheDocument();
  });

  it("shows the page inside the navbar for a logged-in student", async () => {
    logIn("65010042");
    renderRoutes(routes, "/catalog");

    expect(await screen.findByRole("heading", { name: "Catalog page" })).toBeInTheDocument();
    expect(screen.getByText("65010042")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1. Search Catalog" })).toHaveAttribute("aria-current", "page");
  });

  it("switches pages with the tabs", async () => {
    logIn();
    const { user } = renderRoutes(routes, "/catalog");

    await user.click(await screen.findByRole("link", { name: "2. Weekly Timetable" }));
    expect(await screen.findByRole("heading", { name: "Timetable page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "2. Weekly Timetable" })).toHaveAttribute("aria-current", "page");
  });

  it("logs out and returns to the login page", async () => {
    logIn();
    const { user } = renderRoutes(routes, "/catalog");

    await user.click(await screen.findByRole("button", { name: "Log out" }));
    expect(await screen.findByRole("heading", { name: "Login page" })).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });
});
