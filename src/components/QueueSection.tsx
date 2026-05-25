import { ArrowDown, ArrowUp, ChevronsUp, LogOut } from "lucide-react";
import { toast } from "sonner";
import { getPlayerName, getWins } from "../lib/rotation";
import { useAppStore } from "../store/useAppStore";
import { Button } from "./ui/Button";
import { PlayerRow } from "./ui/PlayerRow";

export function QueueSection() {
  const queue = useAppStore((state) => state.queue);
  const players = useAppStore((state) => state.registeredPlayers);
  const getState = useAppStore();
  const moveQueuePlayer = useAppStore((state) => state.moveQueuePlayer);
  const moveQueuePlayerToTop = useAppStore((state) => state.moveQueuePlayerToTop);
  const moveQueuePlayerToRest = useAppStore((state) => state.moveQueuePlayerToRest);

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Queue</h2>
          <p className="text-sm text-slate-500">First in line fills court first.</p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
          {queue.length}
        </span>
      </div>
      <div className="space-y-2">
        {queue.length === 0 ? (
          <EmptyMessage text="No players in queue." />
        ) : (
          queue.map((playerId, index) => (
            <PlayerRow
              actions={
                <>
                  <Button
                    aria-label={`Move ${getPlayerName(players, playerId)} up`}
                    className="min-h-9 px-2"
                    disabled={index === 0}
                    icon={<ArrowUp size={17} />}
                    onClick={() => moveQueuePlayer(playerId, -1)}
                    title="Move up"
                    type="button"
                    variant="ghost"
                  />
                  <Button
                    aria-label={`Move ${getPlayerName(players, playerId)} down`}
                    className="min-h-9 px-2"
                    disabled={index === queue.length - 1}
                    icon={<ArrowDown size={17} />}
                    onClick={() => moveQueuePlayer(playerId, 1)}
                    title="Move down"
                    type="button"
                    variant="ghost"
                  />
                  <Button
                    aria-label={`Move ${getPlayerName(players, playerId)} to top`}
                    className="min-h-9 px-2"
                    disabled={index === 0}
                    icon={<ChevronsUp size={17} />}
                    onClick={() => moveQueuePlayerToTop(playerId)}
                    title="Move to top"
                    type="button"
                    variant="ghost"
                  />
                  <Button
                    aria-label={`Move ${getPlayerName(players, playerId)} to Resting / Out`}
                    className="min-h-9 px-2"
                    icon={<LogOut size={17} />}
                    onClick={() => {
                      moveQueuePlayerToRest(playerId);
                      toast.success("Player moved to Resting / Out");
                    }}
                    title="Rest / Out"
                    type="button"
                    variant="ghost"
                  />
                </>
              }
              detail={`Queue #${index + 1}`}
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

function EmptyMessage({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm font-medium text-slate-500">
      {text}
    </div>
  );
}
