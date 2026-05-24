import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAnnotations, consoleKeys } from "@/hooks/use-console";
import { createAnnotation, deleteAnnotation } from "@/lib/api/telemetry-extra";
import type { AnnotationScope } from "@/lib/types";
import { cn } from "@/lib/utils";

const KINDS = [
  { id: "release", label: "Release", colorVar: "--green" },
  { id: "marketing", label: "Marketing", colorVar: "--acid" },
  { id: "incident", label: "Incident", colorVar: "--red" },
  { id: "note", label: "Note", colorVar: "--cyan" },
] as const;

export function ConsoleAnnotationsManager() {
  const { data } = useAnnotations();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("release");
  const [scope] = useState<AnnotationScope>("global");

  const onSave = async () => {
    if (!text.trim()) return;
    await createAnnotation({
      at: new Date().toISOString(),
      text: text.trim(),
      scope,
      kind,
    });
    setText("");
    setOpen(false);
    qc.invalidateQueries({ queryKey: consoleKeys.annotations() });
  };

  const onDelete = async (id: string) => {
    await deleteAnnotation(id);
    qc.invalidateQueries({ queryKey: consoleKeys.annotations() });
  };

  return (
    <Card className="p-4">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted/55">
            <Calendar className="h-3 w-3" />
            Annotations
          </p>
          <p className="mt-0.5 text-[11px] text-muted/45">
            Mark releases, campaigns, and incidents on every time chart.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-md bg-acid/15 px-2 py-1 text-[11px] font-medium text-acid hover:bg-acid/25"
        >
          <Plus className="h-3 w-3" />
          New
        </button>
      </header>
      {open && (
        <div className="mb-3 rounded-lg border border-separator bg-card-active/40 p-3 space-y-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Annotation text…"
            className="w-full rounded-md bg-input px-2.5 py-1.5 text-[12.5px] text-foreground placeholder:text-muted/50 outline-none focus:ring-1 focus:ring-acid/40"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10.5px] font-medium",
                  kind === k.id
                    ? "bg-card-active text-foreground"
                    : "text-muted/65 hover:text-foreground/80",
                )}
                style={kind === k.id ? { boxShadow: `inset 0 0 0 1px var(${k.colorVar})` } : undefined}
              >
                {k.label}
              </button>
            ))}
            <button
              type="button"
              onClick={onSave}
              className="ml-auto rounded-md bg-acid px-2.5 py-1 text-[11px] font-semibold text-background hover:brightness-110"
            >
              Save
            </button>
          </div>
        </div>
      )}
      {(!data || data.length === 0) ? (
        <p className="py-4 text-center text-[12px] text-muted/55">No annotations yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {data.slice(0, 8).map((a) => {
            const meta = KINDS.find((k) => k.id === a.kind) ?? KINDS[3];
            return (
              <li
                key={a.id}
                className="flex items-center gap-2 rounded-md bg-card-active/40 px-2 py-1.5 text-[12px]"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: `var(${meta.colorVar})` }}
                />
                <span className="truncate text-foreground/85 flex-1 min-w-0">{a.text}</span>
                <span className="shrink-0 text-[11px] text-muted/50 tabular-nums">
                  {new Date(a.at).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(a.id)}
                  className="text-muted/40 hover:text-red transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
