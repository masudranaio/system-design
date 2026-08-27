"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizItemProps {
  question: string;
  answer: string;
}

export function QuizItem({ question, answer }: QuizItemProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="quiz-item border-2 border-quiz-question/25 bg-quiz-question-soft" role="group" aria-label="Quiz question">
      <button
        type="button"
        className="flex w-full items-center gap-4 px-4 py-3 text-left"
        onClick={() => setRevealed((r) => !r)}
        aria-expanded={revealed}
      >
        <span className="flex-1 font-medium text-foreground">{question}</span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-quiz-question px-3 py-1 text-xs font-semibold text-ground shadow-sm">
          {revealed ? "Hide answer" : "View answer"}
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform duration-200", revealed && "rotate-180")}
            aria-hidden="true"
          />
        </span>
      </button>
      {revealed && (
        <div className="border-t border-l-4 border-line border-l-quiz-answer bg-quiz-answer-soft px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-quiz-answer uppercase">Answer</p>
          <p className="mt-1 text-foreground" data-testid="quiz-answer">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}
