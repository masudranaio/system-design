// components/lesson/DiagramLegend.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DiagramLegend } from "./DiagramLegend";

describe("DiagramLegend", () => {
  it("renders one chip per role, labelled", () => {
    render(<DiagramLegend roles={["client", "service", "cache"]} />);
    expect(screen.getByText("Client")).toBeInTheDocument();
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("Cache")).toBeInTheDocument();
  });

  it("renders nothing below two roles — a two-box diagram needs no legend", () => {
    const { container } = render(<DiagramLegend roles={["client"]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when roles is undefined", () => {
    const { container } = render(<DiagramLegend />);
    expect(container).toBeEmptyDOMElement();
  });
});
