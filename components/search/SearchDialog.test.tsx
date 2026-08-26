import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchDialog } from "./SearchDialog";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  push.mockClear();
  global.fetch = vi.fn().mockResolvedValue({
    json: () =>
      Promise.resolve([
        {
          title: "Scalability & Core Metrics",
          href: "/hld/HLD-01-scalability",
          excerpt: "Availability and CAP theorem.",
        },
      ]),
  }) as unknown as typeof fetch;
});

describe("SearchDialog", () => {
  it("opens on trigger click, lists a fetched entry, and navigates to it on select", async () => {
    const user = userEvent.setup();
    render(<SearchDialog />);

    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(screen.getByText("Scalability & Core Metrics")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Scalability & Core Metrics"));
    expect(push).toHaveBeenCalledWith("/hld/HLD-01-scalability");
  });
});
