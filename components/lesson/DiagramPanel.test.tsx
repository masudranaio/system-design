import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DiagramPanel } from "./DiagramPanel";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi
      .fn()
      .mockResolvedValue({ svg: '<svg data-testid="mock-svg"></svg>' }),
  },
}));

describe("DiagramPanel", () => {
  it("renders the title, the type eyebrow label, and injects the rendered SVG", async () => {
    render(
      <DiagramPanel
        title="Request flow"
        type="architecture"
        chart={"graph LR\n  A-->B"}
      />,
    );

    expect(screen.getByText("Request flow")).toBeInTheDocument();
    expect(screen.getByText("architecture")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: "Request flow" }).innerHTML,
      ).toContain("mock-svg");
    });
  });
});
