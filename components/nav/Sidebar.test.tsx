import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import { SidebarNav } from "./SidebarNav";

vi.mock("@/lib/content", () => ({
  buildNavTree: () => [
    {
      title: "High-Level Design",
      items: [
        { label: "Scalability & Core Metrics", href: "/hld/HLD-01-scalability" },
        { label: "Availability", href: "/hld/HLD-02-availability" },
      ],
    },
    { title: "Case Studies", items: [] },
  ],
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/hld/HLD-01-scalability",
}));

describe("Sidebar", () => {
  it("renders a section's links, marks the active route, and shows a fallback for an empty section", () => {
    render(<Sidebar />);

    const activeLink = screen.getByRole("link", {
      name: "Scalability & Core Metrics",
    });
    expect(activeLink).toHaveAttribute("href", "/hld/HLD-01-scalability");
    expect(activeLink).toHaveAttribute("aria-current", "page");

    const inactiveLink = screen.getByRole("link", { name: "Availability" });
    expect(inactiveLink).not.toHaveAttribute("aria-current");

    expect(screen.getByText("No lessons yet")).toBeInTheDocument();
  });

  it("gives each section an icon chip in its track color and a lesson count", () => {
    render(<SidebarNav sections={[{ title: "Low-Level Design", items: [
      { href: "/lld/a", label: "A" }, { href: "/lld/b", label: "B" },
    ] }]} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByTestId("section-chip-Low-Level Design").className).toContain("bg-track-lld/12");
  });
});
