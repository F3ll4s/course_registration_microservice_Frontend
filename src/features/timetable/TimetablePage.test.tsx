import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/features/cart/store";
import { logIn, renderPage } from "@/test/render";
import { TimetablePage } from "./TimetablePage";

// Mock data: enrolled in CS410 (Mon/Wed), CS315 (Fri), GEN201 (Tue/Thu), MTH205 (Mon/Wed 11:00-12:30)

describe("TimetablePage", () => {
  beforeEach(() => logIn());

  it("places each enrolled class on every day it meets", async () => {
    renderPage(<TimetablePage />);

    expect(await screen.findAllByText("CS410 Sec 1 [ENROLLED]")).toHaveLength(2); // Mon and Wed
    expect(screen.getAllByText("CS315 Sec 1 [ENROLLED]")).toHaveLength(1); // Fri
    expect(screen.getByText("Enrolled (4 Courses)")).toBeInTheDocument();
    expect(screen.getByText("12 Total Credits (12 Enrolled, 0 In Cart)")).toBeInTheDocument();
  });

  it("shows cart sections as staged", async () => {
    useCartStore.setState({ sectionIds: [101] }); // CS301 Sec 1, Mon/Wed 09:00-10:30
    renderPage(<TimetablePage />);

    expect(await screen.findAllByText("CS301 Sec 1 [IN CART]")).toHaveLength(2);
    expect(screen.getByText("In Cart / Staged (1)")).toBeInTheDocument();
    expect(screen.getByText("0 Schedule Clashes")).toBeInTheDocument();
  });

  it("marks a cart section that overlaps an enrolled class as a clash", async () => {
    useCartStore.setState({ sectionIds: [103] }); // CS102 Sec 1, Mon/Wed 10:00-11:30, overlaps MTH205
    renderPage(<TimetablePage />);

    expect(await screen.findAllByText("CS102 Sec 1 [CLASH]")).toHaveLength(2);
    expect(screen.getByText("1 Schedule Clash")).toBeInTheDocument();
  });
});
