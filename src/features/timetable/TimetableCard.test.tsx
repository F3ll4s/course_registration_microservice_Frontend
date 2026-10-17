import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/features/cart/store";
import { logIn, renderPage } from "@/test/render";
import { TimetableCard } from "./TimetableCard";

// Mock data: enrolled in CS410 (Mon/Wed), CS315 (Fri), GEN201 (Tue/Thu), MTH205 (Mon/Wed 11:00-12:30)
const blocks = (label: RegExp) => screen.findAllByLabelText(label);

describe("TimetableCard", () => {
  beforeEach(() => logIn());

  it("places each enrolled class on every day it meets", async () => {
    renderPage(<TimetableCard />);

    expect(await blocks(/^CS410 Sec 01, enrolled, 13:30 - 15:00$/)).toHaveLength(2); // Mon and Wed
    expect(await blocks(/^CS315 Sec 01, enrolled/)).toHaveLength(1); // Fri
    expect(screen.getByText("■ Enrolled (4)")).toBeInTheDocument();
    expect(screen.queryByText("No Classes Scheduled Yet")).not.toBeInTheDocument();
  });

  it("shows cart sections as staged", async () => {
    useCartStore.setState({ sectionIds: [101] }); // CS301 Sec 01, Mon/Wed 09:00-10:30
    renderPage(<TimetableCard />);

    expect(await blocks(/^CS301 Sec 01, staged/)).toHaveLength(2);
    expect(screen.getByText("■ Staged (1)")).toBeInTheDocument();
    expect(screen.getByText("■ Conflict (0)")).toBeInTheDocument();
  });

  it("marks a cart section that overlaps an enrolled class as a clash", async () => {
    useCartStore.setState({ sectionIds: [103] }); // CS102 Sec 01, Mon/Wed 10:00-11:30, overlaps MTH205
    renderPage(<TimetableCard />);

    expect(await blocks(/^CS102 Sec 01, clash/)).toHaveLength(2);
    expect(screen.getAllByText("CS102 vs MTH205")).toHaveLength(2);
    expect(screen.getByText("■ Conflict (1)")).toBeInTheDocument();
  });

  it("shows only the logged-in student's classes", async () => {
    logIn("STU_099"); // any other student starts with no enrollments in the mock
    renderPage(<TimetableCard />);

    expect(await screen.findByText("No Classes Scheduled Yet")).toBeInTheDocument();
    expect(screen.queryByLabelText(/^CS410 Sec 01/)).not.toBeInTheDocument();
    expect(screen.getByText("■ Enrolled (0)")).toBeInTheDocument();
  });
});
