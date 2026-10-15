import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/features/cart/store";
import { logIn, renderPage } from "@/test/render";
import { CatalogPane } from "./CatalogPane";

// Mock data (src/mocks): the student completed CS101, CS102, CS201, CS202, is enrolled in
// CS410, CS315, GEN201, MTH205 and is #3 in the CS305 queue. CS301 Sec 02 and CS305 are full.

const findSection = (name: string) => screen.findByRole("group", { name });
const querySection = (name: string) => screen.queryByRole("group", { name });
const card = (name: RegExp) => screen.findByRole("article", { name });

describe("CatalogPane", () => {
  beforeEach(() => logIn());

  it("groups sections into one card per course with seat status", async () => {
    renderPage(<CatalogPane />);

    const cs301 = await card(/^CS301 /);
    expect(within(cs301).getByRole("heading")).toHaveTextContent("Software Design & Architecture (3 Credits)");

    const open = within(cs301).getByRole("group", { name: "CS301 Sec 01" });
    expect(within(open).getByText("Mon, Wed 09:00-10:30")).toBeInTheDocument();
    expect(within(open).getByText("48/50")).toBeInTheDocument();
    expect(within(open).getByText("OPEN")).toBeInTheDocument();

    const full = within(cs301).getByRole("group", { name: "CS301 Sec 02" });
    expect(within(full).getByText("FULL")).toBeInTheDocument();
    expect(within(full).getByRole("button", { name: "Waitlist" })).toBeInTheDocument();
  });

  it("shows prerequisite status and blocks a course with missing prerequisites", async () => {
    renderPage(<CatalogPane />);

    const cs301 = await card(/^CS301 /);
    expect(await within(cs301).findByText(/CS102, CS202 \[ MET/)).toBeInTheDocument();

    const cs420 = await card(/^CS420 /);
    expect(await within(cs420).findByText(/CS302 \[ MISSING/)).toBeInTheDocument();
    expect(within(cs420).getByRole("button", { name: "Blocked" })).toBeDisabled();
  });

  it("marks sections the student already has", async () => {
    renderPage(<CatalogPane />);

    const enrolled = await findSection("CS410 Sec 01");
    expect(await within(enrolled).findByRole("button", { name: "Enrolled" })).toBeDisabled();

    const queued = await findSection("CS305 Sec 01");
    expect(await within(queued).findByRole("button", { name: "Queue #3" })).toBeDisabled();
  });

  it("adds an open section to the cart and removes it again", async () => {
    const { user } = renderPage(<CatalogPane />);
    const row = await findSection("CS301 Sec 01");
    const add = within(row).getByRole("button", { name: "Add Cart" });
    await waitFor(() => expect(add).toBeEnabled());

    await user.click(add);
    expect(useCartStore.getState().sectionIds).toEqual([101]);

    await user.click(within(row).getByRole("button", { name: "Remove" }));
    expect(useCartStore.getState().sectionIds).toEqual([]);
  });

  it("refuses a section that overlaps an enrolled class", async () => {
    const { user } = renderPage(<CatalogPane />);
    // CS102 Sec 01 is Mon/Wed 10:00-11:30; MTH205 Sec 02 (enrolled) is Mon/Wed 11:00-12:30
    const row = await findSection("CS102 Sec 01");
    const add = within(row).getByRole("button", { name: "Add Cart" });
    await waitFor(() => expect(add).toBeEnabled());

    await user.click(add);
    expect(await screen.findByText("Timetable conflict detected")).toBeInTheDocument();
    expect(screen.getByText(/CS102 Sec 01 overlaps with MTH205 Sec 02/)).toBeInTheDocument();
    expect(useCartStore.getState().sectionIds).toEqual([]);
  });

  it("joins the waitlist for a full section", async () => {
    const { user } = renderPage(<CatalogPane />);
    const row = await findSection("CS301 Sec 02");

    await user.click(within(row).getByRole("button", { name: "Waitlist" }));
    expect(await screen.findByText("Section is full. You were added to the waitlist.")).toBeInTheDocument();
  });

  it("searches as you type and resets from the empty state", async () => {
    const { user } = renderPage(<CatalogPane />);
    await findSection("CS301 Sec 01");
    const search = screen.getByLabelText("Search course code or title");

    await user.type(search, "CS420");
    await waitFor(() => expect(querySection("CS301 Sec 01")).toBeNull());
    expect(await findSection("CS420 Sec 01")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "Quantum Computing");
    expect(await screen.findByText("No Courses Found")).toBeInTheDocument();
    expect(screen.getByText(/No sections matched "Quantum Computing"/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset All Filters" }));
    await findSection("CS301 Sec 01");
    expect(search).toHaveValue("");
  });

  it("hides full sections with Open Seats Only", async () => {
    const { user } = renderPage(<CatalogPane />);
    await findSection("CS301 Sec 02");

    await user.click(screen.getByRole("checkbox", { name: "Open Seats Only" }));
    await waitFor(() => expect(querySection("CS301 Sec 02")).toBeNull());
    expect(querySection("CS301 Sec 01")).not.toBeNull();
  });
});
