import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyStat } from "./KeyStat";

describe("KeyStat", () => {
  it("renders the value and label, and puts the detail behind a disclosure", () => {
    render(
      <KeyStat
        value="500K QPS"
        label="Peak reservation traffic, Prime Day"
        detail="2,000 events/sec baseline × ~15x read amplification × ~17x Prime-Day spike ≈ 500K"
      />,
    );

    expect(screen.getByText("500K QPS")).toBeInTheDocument();
    expect(
      screen.getByText("Peak reservation traffic, Prime Day"),
    ).toBeInTheDocument();
    expect(screen.getByText("Show the math")).toBeInTheDocument();
    expect(
      screen.getByText(/2,000 events\/sec baseline/),
    ).toBeInTheDocument();
  });

  it("renders without a disclosure when no detail is given", () => {
    render(<KeyStat value="99.99%" label="Availability SLO" />);
    expect(screen.queryByText("Show the math")).not.toBeInTheDocument();
  });
});
