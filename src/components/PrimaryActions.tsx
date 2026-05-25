import { RotateCcw, Trophy, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { isCourtFull } from "../lib/rotation";
import { useAppStore } from "../store/useAppStore";
import type { TeamKey } from "../types";
import { Button } from "./ui/Button";

export function PrimaryActions() {
  const queueLength = useAppStore((state) => state.queue.length);
  const court = useAppStore((state) => state.court);
  const undoSnapshot = useAppStore((state) => state.undoSnapshot);
  const fillEmptySlots = useAppStore((state) => state.fillEmptySlots);
  const recordWinner = useAppStore((state) => state.recordWinner);
  const undoLastResult = useAppStore((state) => state.undoLastResult);
  const winnerReady = isCourtFull(court);

  function handleFill() {
    fillEmptySlots();
    toast.success("Filled empty slots");
  }

  function handleWinner(team: TeamKey) {
    const label = team === "teamA" ? "Team A" : "Team B";
    if (!window.confirm(`Are you sure ${label} won?`)) return;

    recordWinner(team);
    toast.success(`${label} recorded as winner`);
  }

  function handleUndo() {
    undoLastResult();
    toast.success("Last result undone");
  }

  return (
    <section className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-4">
      <Button
        className="col-span-2 sm:col-span-1"
        disabled={queueLength === 0}
        icon={<UsersRound size={18} />}
        onClick={handleFill}
        type="button"
        variant="primary"
      >
        Fill Empty Slots
      </Button>
      <Button
        disabled={!winnerReady}
        icon={<Trophy size={18} />}
        onClick={() => handleWinner("teamA")}
        type="button"
        variant="success"
      >
        Team A Won
      </Button>
      <Button
        disabled={!winnerReady}
        icon={<Trophy size={18} />}
        onClick={() => handleWinner("teamB")}
        type="button"
        variant="success"
      >
        Team B Won
      </Button>
      <Button
        disabled={!undoSnapshot}
        icon={<RotateCcw size={18} />}
        onClick={handleUndo}
        type="button"
      >
        Undo
      </Button>
    </section>
  );
}
