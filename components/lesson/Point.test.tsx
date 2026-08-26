import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Point } from "./Point";

describe("Point", () => {
  it("renders its text with a role='listitem' wrapper and an icon", () => {
    render(
      <Point icon="database">
        Seat inventory lives in Postgres, the single source of truth.
      </Point>,
    );

    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent(
      "Seat inventory lives in Postgres, the single source of truth.",
    );
    expect(item.querySelector("svg")).not.toBeNull();
  });
});
