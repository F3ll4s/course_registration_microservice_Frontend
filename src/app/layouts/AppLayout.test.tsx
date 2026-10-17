import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProtectedRoute } from "@/app/ProtectedRoute";
import { useAuthStore } from "@/features/auth/store";
import { offerWaitlistSeat } from "@/mocks/handlers/enrollment";
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
          { path: "/registration", element: <h1>Registration page</h1> },
          { path: "/registered", element: <h1>Registered page</h1> },
        ],
      },
    ],
  },
];

describe("ProtectedRoute and AppLayout", () => {
  it("sends a logged-out student to the login page", async () => {
    renderRoutes(routes, "/registration");
    expect(await screen.findByRole("heading", { name: "Login page" })).toBeInTheDocument();
  });

  it("shows the page under the header for a logged-in student", async () => {
    logIn("STU_001");
    renderRoutes(routes, "/registration");

    expect(await screen.findByRole("heading", { name: "Registration page" })).toBeInTheDocument();
    expect(screen.getByText("STU_001")).toBeInTheDocument();
    // Enrolled credits of the mock student
    expect(await screen.findByText("Credits: 12 / 22 Cr")).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Enrolled credits" })).toHaveAttribute("aria-valuenow", "12");
  });

  it("switches pages from the Profile menu", async () => {
    logIn();
    const { user } = renderRoutes(routes, "/registration");

    await user.click(await screen.findByRole("button", { name: "Profile" }));
    expect(await screen.findByRole("menuitem", { name: "Course Registration" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("menuitem", { name: "Registered Courses & Waitlist" }));
    expect(await screen.findByRole("heading", { name: "Registered page" })).toBeInTheDocument();
  });

  it("announces a waitlist seat offer on any page", async () => {
    offerWaitlistSeat(104, 8); // CS305 Sec 01, where the mock student is waitlisted
    logIn();
    renderRoutes(routes, "/registration");

    expect(await screen.findByText("Waitlist offer available")).toBeInTheDocument();
    expect(screen.getByText(/A seat opened for CS305 Sec 01! Claim within 7h 59m\./)).toBeInTheDocument();
  });

  it("logs out from the Profile menu and returns to the login page", async () => {
    logIn();
    const { user } = renderRoutes(routes, "/registration");

    await user.click(await screen.findByRole("button", { name: "Profile" }));
    await user.click(await screen.findByRole("menuitem", { name: "Log out" }));
    expect(await screen.findByRole("heading", { name: "Login page" })).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });
});
