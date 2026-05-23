import { Activity, Globe, Laptop } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLiveSessions } from "@/hooks/use-console";

export function ConsoleLiveSessions() {
  const sessions = useLiveSessions();
  return (
    <Card className="p-4">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted/55">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green" />
            </span>
            Active sessions
          </p>
          <p className="mt-0.5 text-[20px] font-semibold tabular-nums text-foreground">
            {sessions.length}
          </p>
        </div>
        <Activity className="h-4 w-4 text-acid" />
      </header>
      {sessions.length === 0 ? (
        <p className="py-4 text-center text-[12px] text-muted/55">
          No sessions in the last 5 minutes
        </p>
      ) : (
        <ul className="max-h-[260px] space-y-1.5 overflow-y-auto">
          {sessions.slice(0, 12).map((s) => {
            const Icon = s.device.isDesktop ? Laptop : Globe;
            return (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-md bg-card-active/40 px-2 py-1.5 text-[12px]"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted/60" />
                <span className="truncate font-mono text-muted/70">
                  {s.uid?.slice(0, 8) ?? "anon"}
                </span>
                <span className="ml-auto truncate text-muted/50">{s.lastRoute}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
