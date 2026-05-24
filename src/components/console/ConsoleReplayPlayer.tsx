import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { ReplaySession, ReplayFrame } from "@/lib/types";

interface Props {
  replay: ReplaySession;
}

const KIND_COLOR: Record<ReplayFrame["kind"], string> = {
  click: "bg-cyan",
  input: "bg-acid",
  scroll: "bg-muted/40",
  route: "bg-positive",
  viewport: "bg-muted/30",
  rage: "bg-red",
  dead: "bg-orange",
  error: "bg-red",
};

export function ConsoleReplayPlayer({ replay }: Props) {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalMs = replay.durationMs || replay.frames[replay.frames.length - 1]?.t || 1;

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(() => {
      setPos((p) => {
        const next = p + 200;
        if (next >= totalMs) {
          setPlaying(false);
          return totalMs;
        }
        return next;
      });
    }, 200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, totalMs]);

  const visibleFrames = useMemo(() => replay.frames.filter((f) => f.t <= pos), [replay.frames, pos]);
  const currentFrame = visibleFrames[visibleFrames.length - 1];

  function fmt(ms: number): string {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted/45">Session</p>
            <p className="text-[13px] font-semibold text-foreground/85">{replay.sessionId.slice(0, 12)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-md bg-input p-1.5 text-foreground/80 hover:bg-card-hover"
              onClick={() => setPos(0)}
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="rounded-md bg-acid p-1.5 text-background hover:bg-acid/80"
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              className="rounded-md bg-input p-1.5 text-foreground/80 hover:bg-card-hover"
              onClick={() => setPos(totalMs)}
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="rounded-md bg-input p-1.5 text-foreground/80 hover:bg-card-hover"
              onClick={() => {
                setPos(0);
                setPlaying(false);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-input p-4">
          <p className="text-center text-[11px] uppercase tracking-widest text-muted/55">Now showing</p>
          <p className="mt-1 text-center text-[15px] font-semibold text-foreground/90">
            {currentFrame ? `${currentFrame.kind} — ${currentFrame.label ?? currentFrame.target ?? "—"}` : "—"}
          </p>
          <p className="mt-1 text-center text-[11px] text-muted/55">
            t = {currentFrame ? fmt(currentFrame.t) : "0:00"} / {fmt(totalMs)}
          </p>
        </div>

        <div className="mt-3">
          <input
            type="range"
            min={0}
            max={totalMs}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            className="w-full accent-acid"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted/45 tabular-nums">
            <span>{fmt(pos)}</span>
            <span>{fmt(totalMs)}</span>
          </div>
        </div>
      </Card>

      <Card className="p-3">
        <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">Timeline strip</p>
        <div className="relative h-10 overflow-hidden rounded-md bg-input">
          {replay.frames.map((f, i) => (
            <span
              key={i}
              title={`${f.kind} @ ${fmt(f.t)}`}
              className={cn("absolute top-0 h-full w-[2px] opacity-80", KIND_COLOR[f.kind])}
              style={{ left: `${(f.t / totalMs) * 100}%` }}
            />
          ))}
          <span
            className="absolute top-0 h-full w-[2px] bg-foreground"
            style={{ left: `${(pos / totalMs) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted/55">
          {Object.entries(KIND_COLOR).map(([k, c]) => (
            <span key={k} className="flex items-center gap-1">
              <span className={cn("h-2 w-2 rounded-sm", c)} /> {k}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
