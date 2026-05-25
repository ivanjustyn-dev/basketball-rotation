import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { useAppStore } from "./store/useAppStore";

describe("App", () => {
  beforeEach(() => {
    useAppStore.setState({
      registeredPlayers: [],
      queue: [],
      court: {
        teamA: [null, null, null, null, null],
        teamB: [null, null, null, null, null],
      },
      restingPlayers: [],
      checkedInPlayers: [],
      sessionPlayers: {},
      undoSnapshot: null,
    });
  });

  it("registers players, checks them in, fills court, and records a winner", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(
      screen.getByLabelText("Player names"),
      "A\nB\nC\nD\nE\nF\nG\nH\nI\nJ\nK",
    );
    await user.click(screen.getByRole("button", { name: "Add Players" }));

    for (const name of ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"]) {
      await user.click(screen.getByRole("button", { name: `Check in ${name}` }));
    }

    expect(screen.getAllByText("Queue #11").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Fill Empty Slots" }));

    const court = screen.getByRole("heading", { name: "Court" }).closest("section")!;
    expect(within(court).getByText("A")).toBeInTheDocument();
    expect(within(court).getByText("J")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Team A Won" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Team A Won" }));

    expect(screen.getAllByText("Queue #6").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
  });

  it("checks in all registered players at once", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(screen.getByLabelText("Player names"), "A\nB\nC");
    await user.click(screen.getByRole("button", { name: "Add Players" }));
    await user.click(screen.getByRole("button", { name: "Check In All" }));

    expect(screen.getAllByText("Queue #3").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Check In All" })).toBeDisabled();
  });
});
