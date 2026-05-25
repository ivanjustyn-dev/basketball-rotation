import { LogOut, UsersRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  const court = useAppStore((state) => state.court);
  const players = useAppStore((state) => state.registeredPlayers);
  const getState = useAppStore();
  const moveCourtPlayerToQueue = useAppStore((state) => state.moveCourtPlayerToQueue);
  const moveCourtPlayerToRest = useAppStore((state) => state.moveCourtPlayerToRest);

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

                return (
                  <PlayerRow
                    actions={
                      <Button
                        aria-label={`Edit ${getPlayerName(players, playerId)}`}
                        className="min-h-9 px-3"
                        onClick={() =>
                          setSelected({ team, slotIndex: index, playerId })
                        }
                        type="button"
                        variant="ghost"
                      >
                        Edit
                      </Button>
                    }
                    detail={`Slot ${index + 1}`}
                    key={playerId}
                    name={getPlayerName(players, playerId)}
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
            <>
              <Button
                className="flex-1"
                icon={<UsersRound size={18} />}
                onClick={handleMoveToQueue}
                type="button"
              >
                Move to Queue
              </Button>
              <Button
                className="flex-1"
                icon={<LogOut size={18} />}
                onClick={handleRest}
                type="button"
                variant="danger"
              >
                Rest / Out
              </Button>
            </>
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
