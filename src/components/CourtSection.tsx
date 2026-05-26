import { ArrowLeftRight, LogOut, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { COURT_SIZE, getPlayerName, getWins } from "../lib/rotation";
import { useAppStore } from "../store/useAppStore";
import type { PlayerId, TeamKey } from "../types";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { PlayerRow } from "./ui/PlayerRow";

type SelectedCourtPlayer = {
  team: TeamKey;
  slotIndex: number;
  playerId: PlayerId;
};

const teamLabels: Record<TeamKey, string> = {
  teamA: "Team A",
  teamB: "Team B",
};

export function CourtSection() {
  const [selected, setSelected] = useState<SelectedCourtPlayer | null>(null);
  const [swapSource, setSwapSource] = useState<SelectedCourtPlayer | null>(null);
  const court = useAppStore((state) => state.court);
  const players = useAppStore((state) => state.registeredPlayers);
  const getState = useAppStore();
  const moveCourtPlayerToQueue = useAppStore((state) => state.moveCourtPlayerToQueue);
  const moveCourtPlayerToRest = useAppStore((state) => state.moveCourtPlayerToRest);
  const swapCourtPlayers = useAppStore((state) => state.swapCourtPlayers);

  function handleMoveToQueue() {
    if (!selected) return;
    moveCourtPlayerToQueue(selected.team, selected.slotIndex);
    setSelected(null);
    toast.success("Player moved to front of queue");
  }

  function handleRest() {
    if (!selected) return;
    moveCourtPlayerToRest(selected.team, selected.slotIndex);
    setSelected(null);
    toast.success("Player moved to Resting / Out");
  }

  function isSameCourtPlayer(
    first: SelectedCourtPlayer,
    second: SelectedCourtPlayer,
  ) {
    return first.team === second.team && first.slotIndex === second.slotIndex;
  }

  function handleCourtPlayerClick(target: SelectedCourtPlayer) {
    if (!swapSource) {
      setSelected(target);
      return;
    }

    if (isSameCourtPlayer(swapSource, target)) {
      setSwapSource(null);
      toast.message("Swap canceled");
      return;
    }

    const sourceName = getPlayerName(players, swapSource.playerId);
    const targetName = getPlayerName(players, target.playerId);
    swapCourtPlayers(
      swapSource.team,
      swapSource.slotIndex,
      target.team,
      target.slotIndex,
    );
    setSwapSource(null);
    setSelected(null);
    toast.success(`Swapped ${sourceName} and ${targetName}`);
  }

  function handleStartSwap() {
    if (!selected) return;
    setSwapSource(selected);
    setSelected(null);
    toast.message(`Choose who swaps with ${getPlayerName(players, selected.playerId)}`);
  }

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Court</h2>
          <p className="text-sm text-slate-500">Winner buttons unlock at full 5v5.</p>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {(["teamA", "teamB"] as TeamKey[]).map((team) => (
          <article
            className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            key={team}
          >
            <h3 className="mb-3 text-base font-black text-slate-950">
              {teamLabels[team]}
            </h3>
            <div className="space-y-2">
              {Array.from({ length: COURT_SIZE }).map((_, index) => {
                const playerId = court[team][index];
                if (!playerId) {
                  return (
                    <PlayerRow
                      detail={`Slot ${index + 1}`}
                      key={`${team}-${index}`}
                      muted
                      name="Empty"
                    />
                  );
                }

                const courtPlayer = { team, slotIndex: index, playerId };
                const isSwapSource =
                  swapSource !== null && isSameCourtPlayer(swapSource, courtPlayer);
                const playerName = getPlayerName(players, playerId);

                return (
                  <PlayerRow
                    actions={
                      <Button
                        aria-label={
                          swapSource
                            ? isSwapSource
                              ? `Cancel swapping ${playerName}`
                              : `Swap ${getPlayerName(
                                  players,
                                  swapSource.playerId,
                                )} with ${playerName}`
                            : `Edit ${playerName}`
                        }
                        className="min-h-9 px-3"
                        icon={isSwapSource ? <X size={16} /> : undefined}
                        onClick={() => handleCourtPlayerClick(courtPlayer)}
                        type="button"
                        variant={swapSource && !isSwapSource ? "primary" : "ghost"}
                      >
                        {swapSource ? (isSwapSource ? "Cancel" : "Swap") : "Edit"}
                      </Button>
                    }
                    className={cn(
                      isSwapSource && "border-court-accent bg-blue-50",
                    )}
                    detail={`Slot ${index + 1}`}
                    key={playerId}
                    name={playerName}
                    wins={getWins(getState, playerId)}
                  />
                );
              })}
            </div>
          </article>
        ))}
      </div>

      {selected ? (
        <Modal
          footer={
            <div className="grid w-full gap-2 sm:grid-cols-3">
              <Button
                icon={<ArrowLeftRight size={18} />}
                onClick={handleStartSwap}
                type="button"
                variant="primary"
              >
                Swap
              </Button>
              <Button
                icon={<UsersRound size={18} />}
                onClick={handleMoveToQueue}
                type="button"
              >
                Move to Queue
              </Button>
              <Button
                icon={<LogOut size={18} />}
                onClick={handleRest}
                type="button"
                variant="danger"
              >
                Rest / Out
              </Button>
            </div>
          }
          onClose={() => setSelected(null)}
          title={getPlayerName(players, selected.playerId)}
        >
          <p className="text-sm text-slate-600">
            Choose where this player should go. Moving to queue places them at the
            front and resets their win streak.
          </p>
        </Modal>
      ) : null}
    </section>
  );
}
