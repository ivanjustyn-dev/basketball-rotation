import { Play } from "lucide-react";
import { toast } from "sonner";
import { getPlayerName, getWins } from "../lib/rotation";
import { useAppStore } from "../store/useAppStore";
import { Button } from "./ui/Button";
import { PlayerRow } from "./ui/PlayerRow";

export function RestingSection() {
  const restingPlayers = useAppStore((state) => state.restingPlayers);
  const players = useAppStore((state) => state.registeredPlayers);
  const getState = useAppStore();
  const returnRestingPlayerToQueue = useAppStore(
    (state) => state.returnRestingPlayerToQueue,
  );

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Resting / Out</h2>
          <p className="text-sm text-slate-500">Returned players go to queue bottom.</p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
          {restingPlayers.length}
        </span>
      </div>
      <div className="space-y-2">
        {restingPlayers.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm font-medium text-slate-500">
            No resting players.
          </div>
        ) : (
          restingPlayers.map((playerId) => (
            <PlayerRow
              actions={
                <Button
                  className="min-h-9 px-3"
                  icon={<Play size={16} />}
                  onClick={() => {
                    returnRestingPlayerToQueue(playerId);
                    toast.success("Player returned to queue");
                  }}
                  type="button"
                  variant="primary"
                >
                  Return
                </Button>
              }
              key={playerId}
              name={getPlayerName(players, playerId)}
              wins={getWins(getState, playerId)}
            />
          ))
        )}
      </div>
    </section>
  );
}
