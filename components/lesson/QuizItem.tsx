"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface QuizItemProps {
  question: string;
  answer: string;
}

export function QuizItem({ question, answer }: QuizItemProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className="rounded-md border border-line bg-card p-4"
      role="group"
      aria-label="Quiz question"
    >
      <p className="text-foreground">{question}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => setRevealed((r) => !r)}
        aria-expanded={revealed}
      >
        {revealed ? "Hide answer" : "Reveal answer"}
      </Button>
      {revealed && (
        <p
          className="mt-3 border-t border-line pt-3 text-muted-foreground"
          data-testid="quiz-answer"
        >
          {answer}
        </p>
      )}
    </div>
  );
}
