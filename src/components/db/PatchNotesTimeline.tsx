import type { PatchNote } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function PatchNotesTimeline({ notes }: { notes: PatchNote[] }) {
  return (
    <div className="space-y-4">
      {notes.map((n) => (
        <div key={n.version} className="rounded-xl border border-separator bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-card-active px-1.5 py-[2px] font-mono text-[10px] text-foreground/70">
                v{n.version}
              </span>
              <h4 className="text-[13px] font-semibold text-foreground">{n.title}</h4>
            </div>
            <span className="text-[11px] text-muted/60">{formatDate(n.date)}</span>
          </div>
          <ul className="ml-4 list-disc space-y-1 text-[12px] text-muted/80 marker:text-muted/40">
            {n.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
