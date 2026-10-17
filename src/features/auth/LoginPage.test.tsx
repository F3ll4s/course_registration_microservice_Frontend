import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { renderRoutes } from "@/test/render";
import { LoginPage } from "./LoginPage";
import { useAuthStore } from "./store";

const routes = [
  { path: "/login", element: <LoginPage /> },
  { path: "/registration", element: <h1>Registration page</h1> },
  { path: "/registered", element: <h1>Registered page</h1> },
];

describe("LoginPage", () => {
  it("logs in and goes to the registration page", async () => {
    const { user } = renderRoutes(routes, "/login");

    await user.type(screen.getByLabelText("Student ID"), "STU_001");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Registration page" })).toBeInTheDocument();
    expect(useAuthStore.getState().studentId).toBe("STU_001");
  });

  it("returns to the page the student was trying to open", async () => {
    const { user, router } = renderRoutes(routes, "/login");
    // ProtectedRoute redirects with the original location in `state.from`
    await router.navigate("/login", { state: { from: { pathname: "/registered" } } });

    await user.type(screen.getByLabelText("Student ID"), "STU_001");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Registered page" })).toBeInTheDocument();
  });

  it("says the credentials are wrong when the backend answers 401", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () =>
        HttpResponse.json({ detail: "Invalid credentials" }, { status: 401 }),
      ),
    );
    const { user } = renderRoutes(routes, "/login");

    await user.type(screen.getByLabelText("Student ID"), "STU_001");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Incorrect student ID or password.")).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });

  describe("validation", () => {
    // Counts login requests, so the tests can prove invalid input never reaches the backend
    function countLoginRequests() {
      const calls = { count: 0 };
      server.use(
        http.post("*/api/v1/auth/login", () => {
          calls.count++;
          return HttpResponse.json({ detail: "Invalid credentials" }, { status: 401 });
        }),
      );
      return calls;
    }

    it("asks for both fields without calling the backend", async () => {
      const calls = countLoginRequests();
      const { user } = renderRoutes(routes, "/login");

      await user.click(screen.getByRole("button", { name: "Log in" }));

      expect(await screen.findByText("Enter your student ID.")).toBeInTheDocument();
      expect(screen.getByText("Enter your password.")).toBeInTheDocument();
      expect(screen.getByLabelText("Student ID")).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText("Student ID")).toHaveAccessibleDescription("Enter your student ID.");
      expect(calls.count).toBe(0);
    });

    it("rejects a student ID with spaces or symbols", async () => {
      const calls = countLoginRequests();
      const { user } = renderRoutes(routes, "/login");

      await user.type(screen.getByLabelText("Student ID"), "STU 001");
      await user.type(screen.getByLabelText("Password"), "secret");
      await user.click(screen.getByRole("button", { name: "Log in" }));

      expect(await screen.findByText("Student ID can only contain letters, numbers and _.")).toBeInTheDocument();
      expect(screen.queryByText("Enter your password.")).not.toBeInTheDocument();
      expect(calls.count).toBe(0);
    });

    it("clears the message once the field is fixed", async () => {
      const { user } = renderRoutes(routes, "/login");
      const studentId = screen.getByLabelText("Student ID");
      const message = "Student ID can only contain letters, numbers and _.";

      await user.type(studentId, "STU-001");
      await user.type(screen.getByLabelText("Password"), "secret");
      await user.click(screen.getByRole("button", { name: "Log in" }));
      expect(await screen.findByText(message)).toBeInTheDocument();

      await user.clear(studentId);
      await user.type(studentId, "STU_001");
      await waitFor(() => expect(screen.queryByText(message)).not.toBeInTheDocument());
      expect(studentId).not.toHaveAttribute("aria-invalid");
    });
  });
});
