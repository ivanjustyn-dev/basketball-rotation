import { Pencil, Plus, Trash2, UserCheck, UsersRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getPlayerStatus } from "../lib/rotation";
import { useAppStore } from "../store/useAppStore";
import type { PlayerId } from "../types";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { PlayerRow } from "./ui/PlayerRow";

export function RegisteredPlayersSection() {
  const [isAdding, setIsAdding] = useState(false);
  const [names, setNames] = useState("");
  const registeredPlayers = useAppStore((state) => state.registeredPlayers);
  const getState = useAppStore();
  const addPlayers = useAppStore((state) => state.addPlayers);
  const renamePlayer = useAppStore((state) => state.renamePlayer);
  const deletePlayer = useAppStore((state) => state.deletePlayer);
  const checkInAllPlayers = useAppStore((state) => state.checkInAllPlayers);
  const checkInPlayer = useAppStore((state) => state.checkInPlayer);
  const eligibleCheckInCount = registeredPlayers.filter((player) => {
    const status = getPlayerStatus(getState, player.id);
    return status.type === "not-checked-in" || status.type === "resting";
  }).length;

  function handleAddPlayers() {
    const result = addPlayers(names);
    if (result.added.length > 0) {
      toast.success(`Added ${result.added.length} player${result.added.length === 1 ? "" : "s"}`);
    }
    if (result.duplicates.length > 0) {
      toast.warning(`Skipped duplicates: ${result.duplicates.join(", ")}`);
    }
    if (result.added.length === 0 && result.duplicates.length === 0) {
      toast.error("Enter at least one player name");
      return;
    }

    setNames("");
    setIsAdding(false);
  }

  function handleRename(playerId: PlayerId, currentName: string) {
    const nextName = window.prompt("Rename player", currentName);
    if (nextName === null) return;

    const result = renamePlayer(playerId, nextName);
    if (!result.ok && result.reason === "empty") {
      toast.error("Name cannot be blank");
    } else if (!result.ok && result.reason === "duplicate") {
      toast.error("A player with that name already exists");
    } else {
      toast.success("Player renamed");
    }
  }

  function handleDelete(playerId: PlayerId, name: string) {
    if (!window.confirm(`Delete ${name}? This removes them from the active session.`)) {
      return;
    }

    deletePlayer(playerId);
    toast.success("Player deleted");
  }

  function handleCheckInAll() {
    checkInAllPlayers();
    toast.success(`Checked in ${eligibleCheckInCount} player${eligibleCheckInCount === 1 ? "" : "s"}`);
  }

  return (
    <section>
      <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-lg font-black text-slate-950">Registered Players</h2>
          <p className="text-sm text-slate-500">Saved locally on this device.</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0">
          <Button
            disabled={eligibleCheckInCount === 0}
            icon={<UsersRound size={18} />}
            onClick={handleCheckInAll}
            type="button"
          >
            Check In All
          </Button>
          <Button
            icon={<Plus size={18} />}
            onClick={() => setIsAdding(true)}
            type="button"
            variant="primary"
          >
            Add
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {registeredPlayers.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm font-medium text-slate-500">
            Add registered players to start.
          </div>
        ) : (
          registeredPlayers.map((player) => {
            const status = getPlayerStatus(getState, player.id);
            const canCheckIn =
              status.type === "not-checked-in" || status.type === "resting";

            return (
              <PlayerRow
                actions={
                  <>
                    {canCheckIn ? (
                      <Button
                        aria-label={`Check in ${player.name}`}
                        className="min-h-9 px-2"
                        icon={<UserCheck size={17} />}
                        onClick={() => {
                          checkInPlayer(player.id);
                          toast.success(`${player.name} checked in`);
                        }}
                        title="Check in"
                        type="button"
                        variant="ghost"
                      />
                    ) : null}
                    <Button
                      aria-label={`Rename ${player.name}`}
                      className="min-h-9 px-2"
                      icon={<Pencil size={17} />}
                      onClick={() => handleRename(player.id, player.name)}
                      title="Rename"
                      type="button"
                      variant="ghost"
                    />
                    <Button
                      aria-label={`Delete ${player.name}`}
                      className="min-h-9 px-2"
                      icon={<Trash2 size={17} />}
                      onClick={() => handleDelete(player.id, player.name)}
                      title="Delete"
                      type="button"
                      variant="ghost"
                    />
                  </>
                }
                detail={status.label}
                key={player.id}
                name={player.name}
              />
            );
          })
        )}
      </div>

      {isAdding ? (
        <Modal
          footer={
            <>
              <Button className="flex-1" onClick={() => setIsAdding(false)} type="button">
                Cancel
              </Button>
              <Button
                className="flex-1"
                icon={<Plus size={18} />}
                onClick={handleAddPlayers}
                type="button"
                variant="primary"
              >
                Add Players
              </Button>
            </>
          }
          onClose={() => setIsAdding(false)}
          title="Add Players"
        >
          <label className="block text-sm font-bold text-slate-700" htmlFor="player-names">
            Player names
          </label>
          <textarea
            autoFocus
            className="mt-2 min-h-40 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-base outline-none ring-court-accent/20 transition focus:border-court-accent focus:ring-4"
            id="player-names"
            onChange={(event) => setNames(event.target.value)}
            placeholder={"Ivan\nMark\nJosh"}
            value={names}
          />
          <p className="mt-2 text-sm text-slate-500">One player per line.</p>
        </Modal>
      ) : null}
    </section>
  );
}
