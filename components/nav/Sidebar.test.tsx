import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("renders each nav section title and its links", () => {
    render(<Sidebar />);

    expect(screen.getByText("High-Level Design")).toBeInTheDocument();
    const ticketmasterLink = screen.getByRole("link", { name: "Ticketmaster" });
    expect(ticketmasterLink).toHaveAttribute(
      "href",
      "/case-studies/ticketmaster/hld",
    );
  });
});
