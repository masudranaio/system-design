import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("links to each of the four course sections", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("link", { name: "High-Level Design concepts" }),
    ).toHaveAttribute("href", "/hld");
    expect(
      screen.getByRole("link", { name: "Low-Level Design concepts" }),
    ).toHaveAttribute("href", "/lld");
    expect(screen.getByRole("link", { name: "Case studies" })).toHaveAttribute(
      "href",
      "/case-studies/ticketmaster/hld",
    );
    expect(
      screen.getByRole("link", { name: "Interview prep" }),
    ).toHaveAttribute("href", "/interview-prep");
  });
});
