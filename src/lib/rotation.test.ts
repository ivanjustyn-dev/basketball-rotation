import { describe, expect, it } from "vitest";
import {
  addRegisteredPlayers,
  checkInPlayer,
  checkInAllPlayers,
  createInitialState,
  deleteRegisteredPlayer,
  fillEmptySlots,
  getPlayerStatus,
  moveCourtPlayerToQueue,
  moveCourtPlayerToRest,
  moveQueuePlayer,
  moveQueuePlayerToRest,
  moveQueuePlayerToTop,
  recordWinner,
  renameRegisteredPlayer,
  returnRestingPlayerToQueue,
  startNewGameDay,
  undoLastResult,
} from "./rotation";
import type { AppState, Player } from "../types";

function withPlayers(names: string[]): AppState {
  let nextId = 1;
  return addRegisteredPlayers(createInitialState(), names.join("\n"), () =>
    String(nextId++),
  ).state;
}

function checkInAll(state: AppState) {
  return state.registeredPlayers.reduce(
    (nextState, player) => checkInPlayer(nextState, player.id),
    state,
  );
}

function namesFor(state: AppState, ids: string[]) {
  return ids.map((id) => state.registeredPlayers.find((player) => player.id === id)?.name);
}

describe("rotation rules", () => {
  it("registers trimmed names and skips case-insensitive duplicates", () => {
    const result = addRegisteredPlayers(
      createInitialState(),
      " Ivan \nivan\n\nMARK\nMark",
      () => "id",
    );

    expect(result.added.map((player) => player.name)).toEqual(["Ivan", "MARK"]);
    expect(result.duplicates).toEqual(["ivan", "Mark"]);
  });

  it("keeps registration and check-in separate with first-come queue order", () => {
    let state = withPlayers(["A", "B", "C"]);
    expect(state.queue).toEqual([]);

    state = checkInPlayer(state, "2");
    state = checkInPlayer(state, "1");

    expect(namesFor(state, state.queue)).toEqual(["B", "A"]);
    expect(getPlayerStatus(state, "1").label).toBe("Queue #2");
  });

  it("checks in all eligible registered players without duplicating active players", () => {
    let state = withPlayers(["A", "B", "C"]);
    state = checkInPlayer(state, "2");
    state = moveQueuePlayerToRest(state, "2");

    state = checkInAllPlayers(state);

    expect(namesFor(state, state.queue)).toEqual(["A", "B", "C"]);
    expect(state.restingPlayers).toEqual([]);
    expect(state.checkedInPlayers).toEqual(["2", "1", "3"]);
  });

  it("fills empty court slots left to right from the queue", () => {
    let state = checkInAll(withPlayers(["A", "B", "C", "D", "E", "F"]));
    state = {
      ...state,
      queue: ["1", "2", "3", "4", "5"],
      court: { teamA: [null, "6", null, null, null], teamB: [null, null, null, null, null] },
    };

    state = fillEmptySlots(state);

    expect(namesFor(state, state.court.teamA.filter(Boolean) as string[])).toEqual([
      "A",
      "F",
      "B",
      "C",
      "D",
    ]);
    expect(state.court.teamA[1]).toBe("6");
    expect(state.court.teamB[0]).toBe("5");
    expect(state.queue).toEqual([]);
  });

  it("records a winner, rotates two-win winners before losers, and preserves existing queue", () => {
    let state = checkInAll(
      withPlayers(["A", "B", "C", "D", "E", "K", "L", "M", "N", "O", "P", "Q"]),
    );
    state = fillEmptySlots(state);
    state = {
      ...state,
      sessionPlayers: {
        ...state.sessionPlayers,
        "1": { consecutiveWins: 1 },
        "2": { consecutiveWins: 1 },
        "3": { consecutiveWins: 0 },
      },
    };

    state = recordWinner(state, "teamA");

    expect(state.court.teamA).toEqual([null, null, "3", "4", "5"]);
    expect(state.court.teamB).toEqual([null, null, null, null, null]);
    expect(namesFor(state, state.queue)).toEqual(["P", "Q", "A", "B", "K", "L", "M", "N", "O"]);
    expect(state.sessionPlayers["1"].consecutiveWins).toBe(0);
    expect(state.sessionPlayers["3"].consecutiveWins).toBe(1);
    expect(state.sessionPlayers["6"].consecutiveWins).toBe(0);
    expect(state.undoSnapshot).not.toBeNull();
  });

  it("undoes only the last winner result", () => {
    let state = checkInAll(withPlayers(["A", "B", "C", "D", "E", "K", "L", "M", "N", "O"]));
    state = fillEmptySlots(state);
    const before = state;

    state = recordWinner(state, "teamA");
    state = undoLastResult(state);

    expect(state.queue).toEqual(before.queue);
    expect(state.court).toEqual(before.court);
    expect(state.undoSnapshot).toBeNull();
  });

  it("moves queue players and resting players with streak resets", () => {
    let state = checkInAll(withPlayers(["A", "B", "C"]));
    state = {
      ...state,
      sessionPlayers: { ...state.sessionPlayers, "2": { consecutiveWins: 1 } },
    };

    state = moveQueuePlayer(state, "3", -1);
    expect(namesFor(state, state.queue)).toEqual(["A", "C", "B"]);

    state = moveQueuePlayerToTop(state, "2");
    expect(namesFor(state, state.queue)).toEqual(["B", "A", "C"]);

    state = moveQueuePlayerToRest(state, "2");
    expect(state.restingPlayers).toEqual(["2"]);
    expect(state.sessionPlayers["2"].consecutiveWins).toBe(0);

    state = returnRestingPlayerToQueue(state, "2");
    expect(namesFor(state, state.queue)).toEqual(["A", "C", "B"]);
  });

  it("moves court players to queue or resting without auto-filling", () => {
    let state = checkInAll(withPlayers(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"]));
    state = fillEmptySlots(state);
    state = {
      ...state,
      sessionPlayers: { ...state.sessionPlayers, "3": { consecutiveWins: 1 as const } },
    };

    state = moveCourtPlayerToQueue(state, "teamA", 2);
    expect(state.court.teamA[2]).toBeNull();
    expect(namesFor(state, state.queue)).toEqual(["C", "K"]);
    expect(state.sessionPlayers["3"].consecutiveWins).toBe(0);

    state = moveCourtPlayerToRest(state, "teamA", 0);
    expect(state.court.teamA[0]).toBeNull();
    expect(state.restingPlayers).toEqual(["1"]);
    expect(namesFor(state, state.queue)).toEqual(["C", "K"]);
  });

  it("renames, deletes, and starts a new game day cleanly", () => {
    let state = checkInAll(withPlayers(["A", "B", "C", "D", "E", "F"]));
    state = fillEmptySlots(state);

    const renamed = renameRegisteredPlayer(state, "1", "Alpha");
    expect(renamed.ok).toBe(true);
    state = renamed.state;
    expect((state.registeredPlayers[0] as Player).name).toBe("Alpha");

    state = deleteRegisteredPlayer(state, "2");
    expect(state.registeredPlayers.map((player) => player.id)).not.toContain("2");
    expect(state.court.teamA).not.toContain("2");
    expect(state.checkedInPlayers).not.toContain("2");

    state = startNewGameDay(state);
    expect(state.registeredPlayers).toHaveLength(5);
    expect(state.queue).toEqual([]);
    expect(state.court.teamA.every((slot) => slot === null)).toBe(true);
  });
});
