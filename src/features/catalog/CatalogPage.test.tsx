import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/features/cart/store";
import { logIn, renderPage } from "@/test/render";
import { CatalogPage } from "./CatalogPage";

// The row card for one section, found by its course and section number
function queryRow(course: string, section: number) {
  return (
    screen
      .queryAllByText(new RegExp(`^${course} - `))
      .map((t) => t.closest<HTMLElement>('[class*="h-[74px]"]'))
      .find((r) => r && within(r).queryByText(`Sec ${section}`)) ?? null
  );
}

const findRow = (course: string, section: number) =>
  waitFor(() => {
    const row = queryRow(course, section);
    if (!row) throw new Error(`No row for ${course} Sec ${section}`);
    return row;
  });

describe("CatalogPage", () => {
  beforeEach(() => logIn());

  it("lists sections with their seat status", async () => {
    renderPage(<CatalogPage />);

    const open = await findRow("CS301", 1);
    expect(within(open).getByText("48/50 OPEN")).toBeInTheDocument();
    expect(within(open).getByText("Mon, Wed 09:00 - 10:30")).toBeInTheDocument();
    expect(within(open).getByRole("button", { name: "Add to Cart" })).toBeInTheDocument();

    const full = await findRow("CS301", 2);
    expect(within(full).getByText("50/50 FULL")).toBeInTheDocument();
    expect(within(full).getByRole("button", { name: "Join Waitlist" })).toBeInTheDocument();
  });

  it("adds an open section to the cart and can remove it again", async () => {
    const { user } = renderPage(<CatalogPage />);
    const row = await findRow("CS301", 1);
    const add = within(row).getByRole("button", { name: "Add to Cart" });
    await waitFor(() => expect(add).toBeEnabled());

    await user.click(add);
    expect(useCartStore.getState().sectionIds).toEqual([101]);
    expect(await screen.findByText(/Cart Status: 1 staged course \(3 Credits\)/)).toBeInTheDocument();

    await user.click(within(row).getByRole("button", { name: "Remove from Cart" }));
    expect(useCartStore.getState().sectionIds).toEqual([]);
  });

  it("joins the waitlist for a full section and says so", async () => {
    const { user } = renderPage(<CatalogPage />);
    const row = await findRow("CS301", 2);

    await user.click(within(row).getByRole("button", { name: "Join Waitlist" }));
    expect(await screen.findByText("Section is full. You were added to the waitlist.")).toBeInTheDocument();
  });

  it("filters only when Apply Filter is pressed", async () => {
    const { user } = renderPage(<CatalogPage />);
    await findRow("CS301", 1);

    await user.type(screen.getByLabelText("Course keyword or code"), "CS410");
    // Typing alone doesn't change the results
    expect(screen.getAllByText(/^CS301 - /)).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    await findRow("CS410", 1);
    expect(screen.queryByText(/^CS301 - /)).not.toBeInTheDocument();
  });

  it("shows an empty state that resets all filters", async () => {
    const { user } = renderPage(<CatalogPage />);
    await findRow("CS301", 1);

    await user.type(screen.getByLabelText("Course keyword or code"), "Quantum Computing");
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));
    expect(await screen.findByText("No Courses Found")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset All Filters" }));
    await findRow("CS301", 1);
    expect(screen.getByLabelText("Course keyword or code")).toHaveValue("");
  });

  it("hides full sections when Open Sections Only is applied", async () => {
    const { user } = renderPage(<CatalogPage />);
    await findRow("CS301", 2);

    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("button", { name: "Apply Filter" }));

    await waitFor(() => expect(queryRow("CS301", 2)).toBeNull());
    expect(queryRow("CS301", 1)).not.toBeNull();
  });
});
