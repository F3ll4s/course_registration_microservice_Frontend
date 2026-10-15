import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { renderRoutes } from "@/test/render";
import { LoginPage } from "./LoginPage";
import { useAuthStore } from "./store";

const routes = [
  { path: "/login", element: <LoginPage /> },
  { path: "/catalog", element: <h1>Catalog page</h1> },
  { path: "/cart", element: <h1>Cart page</h1> },
];

describe("LoginPage", () => {
  it("logs in and goes to the catalog", async () => {
    const { user } = renderRoutes(routes, "/login");

    await user.type(screen.getByLabelText("Student ID"), "65010042");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Catalog page" })).toBeInTheDocument();
    expect(useAuthStore.getState().studentId).toBe("65010042");
  });

  it("returns to the page the student was trying to open", async () => {
    const { user, router } = renderRoutes(routes, "/login");
    // ProtectedRoute redirects with the original location in `state.from`
    await router.navigate("/login", { state: { from: { pathname: "/cart" } } });

    await user.type(screen.getByLabelText("Student ID"), "65010042");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Cart page" })).toBeInTheDocument();
  });

  it("says the credentials are wrong when the backend answers 401", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () =>
        HttpResponse.json({ detail: "Invalid credentials" }, { status: 401 }),
      ),
    );
    const { user } = renderRoutes(routes, "/login");

    await user.type(screen.getByLabelText("Student ID"), "65010042");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Incorrect student ID or password.")).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });
});
