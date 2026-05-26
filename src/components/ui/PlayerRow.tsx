import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type PlayerRowProps = {
  name: string;
  wins?: number;
  detail?: ReactNode;
  actions?: ReactNode;
  muted?: boolean;
  className?: string;
};

export function PlayerRow({
  name,
  wins,
  detail,
  actions,
  muted = false,
  className,
}: PlayerRowProps) {
  return (
    <div
      className={cn(
        "flex min-h-14 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2",
        muted && "bg-slate-50 text-slate-500",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-semibold text-slate-950">{name}</p>
          {wins !== undefined ? (
            <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
              {wins}W
            </span>
          ) : null}
        </div>
        {detail ? <div className="mt-0.5 text-xs text-slate-500">{detail}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </div>
  );
}
