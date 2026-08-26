import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileNav } from "./MobileNav";

const sections = [
  {
    title: "High-Level Design",
    items: [{ label: "Scalability", href: "/hld/HLD-01-scalability" }],
  },
];

vi.mock("next/navigation", () => ({
  usePathname: () => "/hld/HLD-01-scalability",
}));

describe("MobileNav", () => {
  it("opens the nav tree in an overlay when the trigger is clicked, and closes it", async () => {
    render(<MobileNav sections={sections} />);

    expect(screen.queryByText("Scalability")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open navigation/i }));
    expect(await screen.findByText("Scalability")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close navigation/i }));
    expect(screen.queryByText("Scalability")).not.toBeInTheDocument();
  });
});
