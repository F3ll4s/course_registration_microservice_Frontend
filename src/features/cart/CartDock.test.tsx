import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { sections } from "@/mocks/handlers/catalog";
import { server } from "@/mocks/server";
import { logIn, renderPage } from "@/test/render";
import { CartDock } from "./CartDock";
import { useCartStore } from "./store";

// Mock data (src/mocks): the student completed CS101, CS102, CS201, CS202 and is enrolled in 12 credits.
// 101 = CS301 Sec 01 (prereqs met), 106 = CS420 Sec 01 (missing CS302), 103 = CS102 Sec 01 (clashes with CS301 Sec 01)
const stage = (...ids: number[]) => useCartStore.setState({ sectionIds: ids });

const confirmButton = () => screen.getByRole("button", { name: /Confirm Enrollment|Enrolling/ });
const checks = () => screen.getByText(/^Credit:/).parentElement as HTMLElement;

describe("CartDock", () => {
  beforeEach(() => logIn());

  it("shows an empty cart and disables both actions", async () => {
    renderPage(<CartDock />);

    expect(await screen.findByText("Your Cart is Empty")).toBeInTheDocument();
    expect(screen.getByText("Prerequisites: N/A [ — ]")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear Cart" })).toBeDisabled();
    expect(confirmButton()).toBeDisabled();
  });

  it("checks prerequisites and only submits the eligible courses", async () => {
    stage(101, 106);
    const { user } = renderPage(<CartDock />);

    expect(await screen.findByText(/Missing CS302/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("CS420 can't be enrolled: missing CS302");
    // 12 enrolled + 3 for the one eligible course
    expect(checks()).toHaveTextContent(/Credit: 15\/22 \[ PASS ?\]/);
    expect(checks()).toHaveTextContent(/Prereqs: \[ 1 MISSING ?\]/);

    await waitFor(() => expect(confirmButton()).toBeEnabled());
    expect(confirmButton()).toHaveTextContent("Confirm Enrollment (3 Credits)");
    await user.click(confirmButton());

    expect(await screen.findByText("Successfully registered for CS301 Sec 01 (3 Credits).")).toBeInTheDocument();
    // The enrolled course leaves the cart; the blocked one stays for the student to fix
    expect(useCartStore.getState().sectionIds).toEqual([106]);
  });

  it("blocks confirming when two staged sections clash", async () => {
    stage(101, 103);
    renderPage(<CartDock />);

    await waitFor(() => expect(checks()).toHaveTextContent(/Clashes: 2 \[ ?\]/));
    expect(screen.getByRole("status")).toHaveTextContent("overlaps with");
    expect(confirmButton()).toBeDisabled();
  });

  it("removes one course or clears the whole cart", async () => {
    stage(101, 106);
    const { user } = renderPage(<CartDock />);

    await user.click(await screen.findByRole("button", { name: "Remove CS420 Sec 01" }));
    expect(useCartStore.getState().sectionIds).toEqual([101]);

    await user.click(screen.getByRole("button", { name: "Clear Cart" }));
    expect(useCartStore.getState().sectionIds).toEqual([]);
    expect(await screen.findByText("Your Cart is Empty")).toBeInTheDocument();
  });

  describe("when a section fills up while confirming", () => {
    // Another student takes the last seat of CS301 Sec 01 after it was staged
    const fillSection = (id: number) => {
      const s = sections.find((x) => x.id === id)!;
      s.enrolled_count = s.capacity;
    };

    async function confirmFull() {
      stage(101);
      fillSection(101);
      const { user } = renderPage(<CartDock />);
      await waitFor(() => expect(confirmButton()).toBeEnabled());
      await user.click(confirmButton());
      return { user, dialog: await screen.findByRole("dialog") };
    }

    it("explains it and keeps the waitlist place by default", async () => {
      const { user, dialog } = await confirmFull();

      expect(within(dialog).getByText("Registration failed: seat depleted")).toBeInTheDocument();
      expect(within(dialog).getByText(/final seat in CS301 Sec 01 was claimed/)).toBeInTheDocument();
      // Sec 02 is full and clashes with GEN201, so there is nothing to switch to
      expect(within(dialog).queryByRole("button", { name: /Switch to/ })).not.toBeInTheDocument();

      await user.click(await within(dialog).findByRole("button", { name: "Stay on Waitlist (Queue Position #1)" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(useCartStore.getState().sectionIds).toEqual([]);
    });

    it("can leave that waitlist instead", async () => {
      const { user, dialog } = await confirmFull();

      await user.click(within(dialog).getByRole("button", { name: "Leave CS301 Waitlist" }));
      expect(await screen.findByText("Left waitlist")).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("switches to another open section that fits", async () => {
      // Make CS301 Sec 02 open and move it to Friday afternoon, clear of the enrolled classes
      sections.find((x) => x.id === 102)!.enrolled_count = 10;
      server.use(
        http.get("*/catalog/sections", () =>
          HttpResponse.json(
            sections.map((s) =>
              s.id === 102 ? { ...s, schedule_days: ["FRI"], start_time: "13:00", end_time: "14:30" } : s,
            ),
          ),
        ),
      );
      const { user, dialog } = await confirmFull();

      await user.click(await within(dialog).findByRole("button", { name: "Switch to Sec 02 & Re-submit" }));
      expect(await screen.findByText("Switched to CS301 Sec 02 (3 Credits).")).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  });
});
