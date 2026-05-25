import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../store/useAppStore";
import { Button } from "./ui/Button";

export function AppHeader() {
  const startNewGameDay = useAppStore((state) => state.startNewGameDay);

  function handleStartNewGameDay() {
    const confirmed = window.confirm(
      "Start a new game day? Registered players will stay saved.",
    );
    if (!confirmed) return;

    startNewGameDay();
    toast.success("New game day started");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-normal text-slate-950">
            Basketball Rotation
          </h1>
          <p className="text-xs font-medium text-slate-500">Pickup game queue</p>
        </div>
        <Button
          className="min-h-10 px-3 text-xs sm:text-sm"
          icon={<RotateCcw size={16} />}
          onClick={handleStartNewGameDay}
          type="button"
        >
          New Day
        </Button>
      </div>
    </header>
  );
}
