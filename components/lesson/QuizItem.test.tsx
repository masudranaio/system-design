import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuizItem } from "./QuizItem";

describe("QuizItem", () => {
  it("hides the answer until revealed, then shows it and can hide it again", () => {
    render(<QuizItem question="Why teal?" answer="Because signal." />);

    const toggle = screen.getByRole("button", { name: /Why teal\?/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("View answer")).toBeInTheDocument();
    expect(screen.queryByTestId("quiz-answer")).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Hide answer")).toBeInTheDocument();
    expect(screen.getByTestId("quiz-answer")).toHaveTextContent("Because signal.");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
