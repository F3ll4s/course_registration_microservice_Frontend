import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { logIn, renderPage } from "@/test/render";
import { RegisteredPage } from "./RegisteredPage";

// Mock data: enrolled in CS410, CS315, GEN201, MTH205; waitlisted for CS305 at position #3

describe("RegisteredPage", () => {
  beforeEach(() => logIn());

  it("lists enrolled courses and waitlist positions", async () => {
    renderPage(<RegisteredPage />);

    expect(await screen.findByText(/^CS410 - /)).toBeInTheDocument();
    expect(screen.getByText(/4 Enrolled Courses/)).toHaveTextContent("12 Credits");
    expect(screen.getAllByRole("button", { name: "Drop Course" })).toHaveLength(4);

    expect(await screen.findByText("Position: #3 in queue")).toBeInTheDocument();
    expect(screen.getByText("2 students ahead in waitlist queue")).toBeInTheDocument();
  });

  it("asks before dropping and keeps the seat on cancel", async () => {
    const { user } = renderPage(<RegisteredPage />);
    await screen.findByText(/^CS410 - /);

    await user.click(screen.getAllByRole("button", { name: "Drop Course" })[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/CS410 • Artificial Intelligence/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Keep My Seat" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText(/^CS410 - /)).toBeInTheDocument();
  });

  it("drops the course after confirming", async () => {
    const { user } = renderPage(<RegisteredPage />);
    await screen.findByText(/^CS410 - /);

    await user.click(screen.getAllByRole("button", { name: "Drop Course" })[0]);
    await user.click(await screen.findByRole("button", { name: "Yes, Drop Course" }));

    expect(await screen.findByText("Section dropped.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/^CS410 - /)).not.toBeInTheDocument());
    expect(screen.getByText(/3 Enrolled Courses/)).toBeInTheDocument();
  });

  it("leaves the waitlist after confirming", async () => {
    const { user } = renderPage(<RegisteredPage />);

    await user.click(await screen.findByRole("button", { name: "Leave Waitlist" }));
    await user.click(await screen.findByRole("button", { name: "Yes, Leave Waitlist" }));

    expect(await screen.findByText("No Active Waitlist Positions")).toBeInTheDocument();
  });
});
