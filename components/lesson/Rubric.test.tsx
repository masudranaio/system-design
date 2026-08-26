import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Rubric } from "./Rubric";

describe("Rubric", () => {
  it("starts at Novice and updates the self-score band as items are checked", async () => {
    const user = userEvent.setup();
    render(<Rubric items={["Covers A", "Covers B", "Covers C"]} />);

    expect(screen.getByTestId("self-score-band")).toHaveTextContent(
      "Novice — 0% covered",
    );

    await user.click(screen.getByRole("checkbox", { name: "Covers A" }));
    await user.click(screen.getByRole("checkbox", { name: "Covers B" }));
    expect(screen.getByTestId("self-score-band")).toHaveTextContent(
      "Practicing — 67% covered",
    );

    await user.click(screen.getByRole("checkbox", { name: "Covers C" }));
    expect(screen.getByTestId("self-score-band")).toHaveTextContent(
      "Interview-ready — 100% covered",
    );
  });
});
