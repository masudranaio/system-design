import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";

vi.mock("@/lib/content", () => ({
  buildNavTree: () => [
    {
      title: "High-Level Design",
      items: [
        { label: "Scalability & Core Metrics", href: "/hld/HLD-01-scalability" },
      ],
    },
    { title: "Case Studies", items: [] },
  ],
}));

describe("Sidebar", () => {
  it("renders a section's links, and a fallback message for an empty section", () => {
    render(<Sidebar />);

    const link = screen.getByRole("link", {
      name: "Scalability & Core Metrics",
    });
    expect(link).toHaveAttribute("href", "/hld/HLD-01-scalability");
    expect(screen.getByText("No lessons yet")).toBeInTheDocument();
  });
});
