import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { logIn, renderPage } from "@/test/render";
import { CartPage } from "./CartPage";
import { useCartStore } from "./store";

// Mock data (src/mocks): the student completed CS101, CS102, CS201, CS202 and is enrolled in 12 credits.
// 101 = CS301 Sec 1 (prereqs met), 106 = CS420 Sec 1 (missing CS302), 103 = CS102 Sec 1 (clashes with CS301 Sec 1)
const stage = (...ids: number[]) => useCartStore.setState({ sectionIds: ids });

const confirmButton = () => screen.getByRole("button", { name: /Confirm & Enroll|Enrolling/ });

describe("CartPage", () => {
  beforeEach(() => logIn());

  it("shows an empty cart and disables both actions", async () => {
    renderPage(<CartPage />);

    expect(await screen.findByText("Your Cart is Empty")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear Cart" })).toBeDisabled();
    expect(confirmButton()).toBeDisabled();
  });

  it("checks prerequisites and only submits the eligible courses", async () => {
    stage(101, 106);
    const { user } = renderPage(<CartPage />);

    expect(await screen.findByText("Prereqs: MET")).toBeInTheDocument();
    expect(await screen.findByText("Prereqs: MISSING CS302")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Enrollment for CS420 is blocked");
    // 12 enrolled + 3 for the one eligible course
    expect(screen.getByText("15 / 22 Credits")).toBeInTheDocument();

    await waitFor(() => expect(confirmButton()).toBeEnabled());
    expect(confirmButton()).toHaveTextContent("Confirm & Enroll (1 Eligible)");
    await user.click(confirmButton());

    expect(await screen.findByText("1 enrolled, 0 waitlisted")).toBeInTheDocument();
    // The enrolled course leaves the cart; the blocked one stays for the student to fix
    expect(useCartStore.getState().sectionIds).toEqual([106]);
  });

  it("blocks confirming when two staged sections clash", async () => {
    stage(101, 103);
    renderPage(<CartPage />);

    expect(await screen.findByText("Clashes: 2 Detected")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("overlaps with");
    expect(confirmButton()).toBeDisabled();
  });

  it("removes one course or clears the whole cart", async () => {
    stage(101, 106);
    const { user } = renderPage(<CartPage />);

    const row = (await screen.findByText(/^CS420 - /)).closest<HTMLElement>('[class*="h-[78px]"]');
    await user.click(within(row as HTMLElement).getByRole("button", { name: "Remove" }));
    expect(useCartStore.getState().sectionIds).toEqual([101]);

    await user.click(screen.getByRole("button", { name: "Clear Cart" }));
    expect(useCartStore.getState().sectionIds).toEqual([]);
    expect(await screen.findByText("Your Cart is Empty")).toBeInTheDocument();
  });
});
