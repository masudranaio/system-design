import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuizItem } from "./QuizItem";

describe("QuizItem", () => {
  it("hides the answer until revealed, then shows it and can hide it again", () => {
    render(<QuizItem question="Why teal?" answer="Because signal." />);

    expect(screen.getByText("Why teal?")).toBeInTheDocument();
    expect(screen.queryByTestId("quiz-answer")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    expect(screen.getByTestId("quiz-answer")).toHaveTextContent("Because signal.");

    fireEvent.click(screen.getByRole("button", { name: /hide answer/i }));
    expect(screen.queryByTestId("quiz-answer")).not.toBeInTheDocument();
  });
});
