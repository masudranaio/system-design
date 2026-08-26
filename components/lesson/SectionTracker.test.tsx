import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionTracker } from "./SectionTracker";

describe("SectionTracker", () => {
  it("marks only the active section with aria-current", () => {
    render(
      <SectionTracker
        sections={["Problem", "Core", "Trade-offs"]}
        active="Core"
      />,
    );

    expect(screen.getByText("Core").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.getByText("Problem").closest("li")).not.toHaveAttribute(
      "aria-current",
    );
  });
});
