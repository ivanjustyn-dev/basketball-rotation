import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  addRegisteredPlayers,
  checkInAllPlayers,
  checkInPlayer,
  createInitialState,
  deleteRegisteredPlayer,
  fillEmptySlots,
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
} from "../lib/rotation";
import type { AppState, PlayerId, TeamKey } from "../types";

type AddPlayersResult = ReturnType<typeof addRegisteredPlayers>;
type RenameResult = ReturnType<typeof renameRegisteredPlayer>;

type AppActions = {
  addPlayers: (input: string) => AddPlayersResult;
  renamePlayer: (playerId: PlayerId, name: string) => RenameResult;
  deletePlayer: (playerId: PlayerId) => void;
  startNewGameDay: () => void;
  checkInAllPlayers: () => void;
  checkInPlayer: (playerId: PlayerId) => void;
  fillEmptySlots: () => void;
  recordWinner: (team: TeamKey) => void;
  undoLastResult: () => void;
  moveQueuePlayer: (playerId: PlayerId, direction: -1 | 1) => void;
  moveQueuePlayerToTop: (playerId: PlayerId) => void;
  moveQueuePlayerToRest: (playerId: PlayerId) => void;
  moveCourtPlayerToQueue: (team: TeamKey, slotIndex: number) => void;
  moveCourtPlayerToRest: (team: TeamKey, slotIndex: number) => void;
  returnRestingPlayerToQueue: (playerId: PlayerId) => void;
};

export type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      addPlayers: (input) => {
        const result = addRegisteredPlayers(get(), input);
        set(result.state);
        return result;
      },
      renamePlayer: (playerId, name) => {
        const result = renameRegisteredPlayer(get(), playerId, name);
        set(result.state);
        return result;
      },
      deletePlayer: (playerId) => set(deleteRegisteredPlayer(get(), playerId)),
      startNewGameDay: () => set(startNewGameDay(get())),
      checkInAllPlayers: () => set(checkInAllPlayers(get())),
      checkInPlayer: (playerId) => set(checkInPlayer(get(), playerId)),
      fillEmptySlots: () => set(fillEmptySlots(get())),
      recordWinner: (team) => set(recordWinner(get(), team)),
      undoLastResult: () => set(undoLastResult(get())),
      moveQueuePlayer: (playerId, direction) =>
        set(moveQueuePlayer(get(), playerId, direction)),
      moveQueuePlayerToTop: (playerId) => set(moveQueuePlayerToTop(get(), playerId)),
      moveQueuePlayerToRest: (playerId) => set(moveQueuePlayerToRest(get(), playerId)),
      moveCourtPlayerToQueue: (team, slotIndex) =>
        set(moveCourtPlayerToQueue(get(), team, slotIndex)),
      moveCourtPlayerToRest: (team, slotIndex) =>
        set(moveCourtPlayerToRest(get(), team, slotIndex)),
      returnRestingPlayerToQueue: (playerId) =>
        set(returnRestingPlayerToQueue(get(), playerId)),
    }),
    {
      name: "basketball-rotation-app",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        registeredPlayers: state.registeredPlayers,
        queue: state.queue,
        court: state.court,
        restingPlayers: state.restingPlayers,
        checkedInPlayers: state.checkedInPlayers,
        sessionPlayers: state.sessionPlayers,
        undoSnapshot: state.undoSnapshot,
      }),
    },
  ),
);
