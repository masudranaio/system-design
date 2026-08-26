import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompareTable } from "./CompareTable";

describe("CompareTable", () => {
  it("renders every approach with its pros, cons, and the chosen reason", () => {
    render(
      <CompareTable
        title="Optimistic vs. pessimistic locking"
        rows={[
          {
            approach: "Optimistic locking",
            pros: ["No held connections", "Scales under low contention"],
            cons: ["Wasted work on conflict"],
            chosenBecause: "Seat holds are short-lived, conflicts are rare",
          },
          {
            approach: "Pessimistic locking",
            pros: ["No wasted work"],
            cons: ["Holds a DB connection for the lock's duration"],
          },
        ]}
      />,
    );

    expect(
      screen.getByText("Optimistic vs. pessimistic locking"),
    ).toBeInTheDocument();
    expect(screen.getByText("Optimistic locking")).toBeInTheDocument();
    expect(screen.getByText("Pessimistic locking")).toBeInTheDocument();
    expect(screen.getByText("No held connections")).toBeInTheDocument();
    expect(
      screen.getByText("Wasted work on conflict"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Seat holds are short-lived, conflicts are rare"),
    ).toBeInTheDocument();
  });
});
