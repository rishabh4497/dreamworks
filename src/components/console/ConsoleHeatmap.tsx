import { Fragment } from "react";
import { cn } from "@/lib/utils";

interface Cell {
  dow: number;
  hour: number;
  count: number;
}

interface Props {
  cells: Cell[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ConsoleHeatmap({ cells }: Props) {
  const max = Math.max(1, ...cells.map((c) => c.count));
  const byKey = new Map(cells.map((c) => [`${c.dow}-${c.hour}`, c.count]));
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid" style={{ gridTemplateColumns: "auto repeat(24, minmax(14px, 1fr))" }}>
        <div />
        {Array.from({ length: 24 }).map((_, h) => (
          <div key={`h-${h}`} className="text-center text-[10px] text-muted/45">
            {h % 3 === 0 ? h : ""}
          </div>
        ))}
        {DAYS.map((label, dow) => (
          <Fragment key={`row-${dow}`}>
            <div className="pr-2 text-right text-[10px] text-muted/55">{label}</div>
            {Array.from({ length: 24 }).map((_, h) => {
              const value = byKey.get(`${dow}-${h}`) ?? 0;
              const alpha = max === 0 ? 0 : value / max;
              return (
                <div
                  key={`${dow}-${h}`}
                  title={`${label} ${h}:00 — ${value}`}
                  className={cn(
                    "m-[1px] h-4 rounded-[3px] border border-separator/40",
                    value === 0 && "bg-card-active/40",
                  )}
                  style={
                    value === 0
                      ? undefined
                      : {
                          background: `color-mix(in srgb, var(--acid) ${Math.round(alpha * 100)}%, var(--card-active))`,
                        }
                  }
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
