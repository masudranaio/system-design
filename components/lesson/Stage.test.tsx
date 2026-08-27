import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stage, stageSlug } from "./Stage";

describe("stageSlug", () => {
  it("builds a stable id from the version number and title", () => {
    expect(stageSlug(2, "Availability service with counters")).toBe(
      "v2-availability-service-with-counters",
    );
  });

  it("strips punctuation and collapses runs of separators", () => {
    expect(stageSlug(3, "Redis + per-lot counters (finally!)")).toBe(
      "v3-redis-per-lot-counters-finally",
    );
  });
});

describe("Stage", () => {
  it("renders the version chip, title, and verdict as a linkable h2", () => {
    render(
      <Stage
        n={2}
        title="Cached availability"
        verdict="Fixes the read load on the ticket DB; adds a cache that can drift from it."
      />,
    );

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAttribute("id", "v2-cached-availability");
    expect(heading).toHaveTextContent("Cached availability");
    expect(screen.getByText("v2")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Fixes the read load on the ticket DB; adds a cache that can drift from it.",
      ),
    ).toBeInTheDocument();
  });

  it("marks the accepted design without changing the heading contract", () => {
    render(
      <Stage
        n={4}
        title="Regional partitioning"
        verdict="Survives a region outage; doubles the operational surface."
        final
      />,
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute(
      "id",
      "v4-regional-partitioning",
    );
    // The `final` variant is announced to assistive tech, not conveyed
    // by color alone.
    expect(screen.getByText("final design")).toBeInTheDocument();
  });
});
