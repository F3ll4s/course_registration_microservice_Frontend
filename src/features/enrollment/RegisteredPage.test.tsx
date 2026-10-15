import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { offerWaitlistSeat } from "@/mocks/handlers/enrollment";
import { logIn, renderPage } from "@/test/render";
import { RegisteredPage } from "./RegisteredPage";

// Mock data: enrolled in CS410, CS315, GEN201, MTH205; waitlisted for CS305 at position #3

const enrolledTable = () => screen.getByRole("region", { name: "Enrolled courses" });
const waitlistTable = () => screen.getByRole("region", { name: "Waitlist" });

describe("RegisteredPage", () => {
  beforeEach(() => logIn());

  it("lists enrolled courses and waitlist positions", async () => {
    renderPage(<RegisteredPage />);

    expect(await screen.findByText("Artificial Intelligence & Deep Learning")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Confirmed Enrolled Courses (12 Credits)" })).toBeInTheDocument();
    expect(within(enrolledTable()).getAllByRole("button", { name: "Drop Course" })).toHaveLength(4);

    expect(await within(waitlistTable()).findByText("#3 in line")).toBeInTheDocument();
    expect(within(waitlistTable()).getByText("IN QUEUE")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Active Waitlist Queues (1 Section Pending)" })).toBeInTheDocument();
  });

  it("asks before dropping and keeps the seat on cancel", async () => {
    const { user } = renderPage(<RegisteredPage />);
    await screen.findByText("Artificial Intelligence & Deep Learning");

    await user.click(screen.getAllByRole("button", { name: "Drop Course" })[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Confirm Course Drop")).toBeInTheDocument();
    expect(within(dialog).getByText(/CS410 • Artificial Intelligence & Deep Learning \(Section 01\)/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Keep My Seat" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Artificial Intelligence & Deep Learning")).toBeInTheDocument();
  });

  it("drops the course after confirming", async () => {
    const { user } = renderPage(<RegisteredPage />);
    await screen.findByText("Artificial Intelligence & Deep Learning");

    await user.click(screen.getAllByRole("button", { name: "Drop Course" })[0]);
    await user.click(await screen.findByRole("button", { name: "Yes, Drop Course" }));

    expect(await screen.findByText("Course dropped")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("Artificial Intelligence & Deep Learning")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("heading", { name: "Confirmed Enrolled Courses (9 Credits)" })).toBeInTheDocument();
  });

  it("leaves the waitlist after confirming", async () => {
    const { user } = renderPage(<RegisteredPage />);

    await user.click(await screen.findByRole("button", { name: "Leave Waitlist" }));
    await user.click(await screen.findByRole("button", { name: "Yes, Leave Waitlist" }));

    expect(await screen.findByText(/No active waitlist queues/)).toBeInTheDocument();
  });

  it("shows a seat offer banner and claims the seat", async () => {
    offerWaitlistSeat(104); // CS305 Sec 01
    const { user } = renderPage(<RegisteredPage />);

    expect(await screen.findByText("🎉 OFFER READY")).toBeInTheDocument();
    expect(
      screen.getByText(/Seat offer available for CS305 Section 01! Reservation expires in 23h 59m\./),
    ).toBeInTheDocument();
    expect(within(waitlistTable()).getByText("OFFER PENDING")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Claim Seat Now" }));
    expect(await screen.findByText("Seat claimed")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("🎉 OFFER READY")).not.toBeInTheDocument());
    expect(within(enrolledTable()).getByText("Database Systems & Cloud")).toBeInTheDocument();
  });

  it("asks before declining a seat offer", async () => {
    offerWaitlistSeat(104);
    const { user } = renderPage(<RegisteredPage />);

    await user.click(await screen.findByRole("button", { name: "Decline" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Decline Seat Offer")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Yes, Decline Offer" }));
    expect(await screen.findByText("Offer declined")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("🎉 OFFER READY")).not.toBeInTheDocument());
  });
});
