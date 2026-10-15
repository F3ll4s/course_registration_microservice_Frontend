import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAuthStore } from "@/features/auth/store";
import { logIn } from "@/test/render";
import { AppProvider } from "./AppProvider";

function renderProvider() {
  let client: QueryClient | undefined;
  function Probe() {
    client = useQueryClient();
    return null;
  }
  render(
    <AppProvider>
      <Probe />
    </AppProvider>,
  );
  return client!;
}

describe("AppProvider", () => {
  it("forgets the previous student's data on logout", () => {
    logIn("65010042");
    const client = renderProvider();
    client.setQueryData(["enrollments", "me"], [{ section_id: 105, status: "ENROLLED" }]);

    act(() => useAuthStore.getState().logout());
    expect(client.getQueryData(["enrollments", "me"])).toBeUndefined();
  });

  it("keeps the cache while the same student stays logged in", () => {
    logIn("65010042");
    const client = renderProvider();
    client.setQueryData(["enrollments", "me"], []);

    act(() => useAuthStore.setState({ token: useAuthStore.getState().token }));
    expect(client.getQueryData(["enrollments", "me"])).toEqual([]);
  });
});
