import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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

  it("renders zoom controls and a fullscreen expand button", async () => {
    render(
      <DiagramPanel title="Request flow" type="architecture" chart={"graph LR\n  A-->B"} />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: "Request flow" }).innerHTML,
      ).toContain("mock-svg");
    });

    expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset zoom/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /expand diagram/i })).toBeInTheDocument();
  });

  it("opens a fullscreen dialog showing the same diagram when expand is clicked", async () => {
    render(
      <DiagramPanel title="Request flow" type="architecture" chart={"graph LR\n  A-->B"} />,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: "Request flow" }).innerHTML,
      ).toContain("mock-svg");
    });

    fireEvent.click(screen.getByRole("button", { name: /expand diagram/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Request flow")).toBeInTheDocument();
  });
});
