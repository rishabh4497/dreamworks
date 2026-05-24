import { useMemo, useState } from "react";
import { Database, Play, Plus, Save, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import {
  useDeleteQuery,
  useQueries,
  useRunQuery,
  useSaveQuery,
} from "@/hooks/use-console-advanced";
import type { AdHocFilter, AdHocQuerySpec } from "@/lib/types";

const COLLECTIONS: AdHocQuerySpec["collection"][] = [
  "telemetryEvents",
  "telemetryErrors",
  "telemetryPerf",
  "telemetrySessions",
];

const OPS: AdHocFilter["op"][] = ["==", "!=", ">", ">=", "<", "<="];

const AGGREGATES: AdHocQuerySpec["aggregate"][] = ["count", "sum", "avg", "min", "max"];

export function ConsoleQueryBuilder() {
  const { data: saved = [] } = useQueries();
  const save = useSaveQuery();
  const del = useDeleteQuery();
  const auth = useAuthStore((s) => s.authState);
  const uid = auth.type === "Authenticated" ? auth.user.uid : "anon";
  const [selected, setSelected] = useState<string | null>(saved[0]?.id ?? null);
  const [draft, setDraft] = useState<Omit<AdHocQuerySpec, "id" | "createdAt" | "updatedAt">>({
    name: "Query",
    collection: "telemetryEvents",
    filters: [],
    aggregate: "count",
    chartType: "table",
    limit: 200,
    ownerUid: uid,
  });
  const activeId = selected ?? saved[0]?.id ?? null;
  const activeSpec = useMemo<AdHocQuerySpec | null>(() => {
    const active = saved.find((q) => q.id === activeId);
    if (active) return active;
    if (draft.name) {
      return {
        id: "preview",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...draft,
      };
    }
    return null;
  }, [activeId, saved, draft]);
  const { data: result } = useRunQuery(activeSpec);

  function addFilter() {
    setDraft({
      ...draft,
      filters: [...draft.filters, { field: "type", op: "==", value: "page_view" }],
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="p-3">
        <p className="mb-3 text-[11px] uppercase tracking-widest text-muted/55">Saved queries</p>
        <ul className="space-y-1">
          {saved.map((q) => (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => setSelected(q.id)}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] hover:bg-card-hover ${
                  activeId === q.id ? "bg-card-active text-foreground" : "text-muted/75"
                }`}
              >
                <span className="truncate">{q.name}</span>
                <Database className="h-3 w-3 text-muted/45" />
              </button>
            </li>
          ))}
          {saved.length === 0 && (
            <li className="py-3 text-center text-[11px] text-muted/45">No saved queries</li>
          )}
        </ul>
        {activeId && (
          <button
            type="button"
            onClick={() => del.mutate(activeId)}
            className="mt-3 flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] text-red hover:bg-red/10"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        )}
      </Card>

      <div className="space-y-3">
        <Card className="p-4">
          <p className="mb-3 text-[11px] uppercase tracking-widest text-muted/55">Builder</p>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-48 rounded-md bg-input px-2 py-1.5 text-[12px] text-foreground outline-none"
              />
              <select
                value={draft.collection}
                onChange={(e) =>
                  setDraft({ ...draft, collection: e.target.value as AdHocQuerySpec["collection"] })
                }
                className="rounded-md bg-input px-2 py-1.5 text-[12px] text-foreground outline-none"
              >
                {COLLECTIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <select
                value={draft.aggregate}
                onChange={(e) =>
                  setDraft({ ...draft, aggregate: e.target.value as AdHocQuerySpec["aggregate"] })
                }
                className="rounded-md bg-input px-2 py-1.5 text-[12px] text-foreground outline-none"
              >
                {AGGREGATES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
              <input
                placeholder="group by (optional)"
                value={draft.groupBy ?? ""}
                onChange={(e) => setDraft({ ...draft, groupBy: e.target.value || undefined })}
                className="w-40 rounded-md bg-input px-2 py-1.5 text-[12px] text-foreground outline-none"
              />
              <button
                type="button"
                onClick={addFilter}
                className="rounded-md bg-input px-2 py-1.5 text-[11px] text-muted/75 hover:bg-card-hover"
              >
                <Plus className="-mt-0.5 mr-0.5 inline h-3 w-3" /> filter
              </button>
              <button
                type="button"
                onClick={async () => {
                  await save.mutateAsync(draft);
                }}
                className="ml-auto rounded-md bg-acid px-3 py-1.5 text-[11.5px] font-semibold text-background hover:bg-acid/80"
              >
                <Save className="-mt-0.5 mr-1 inline h-3 w-3" />
                Save query
              </button>
            </div>
            {draft.filters.map((f, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  placeholder="field"
                  value={f.field}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      filters: draft.filters.map((x, idx) =>
                        idx === i ? { ...x, field: e.target.value } : x,
                      ),
                    })
                  }
                  className="w-36 rounded-md bg-input px-2 py-1.5 text-[11.5px] text-foreground outline-none"
                />
                <select
                  value={f.op}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      filters: draft.filters.map((x, idx) =>
                        idx === i ? { ...x, op: e.target.value as AdHocFilter["op"] } : x,
                      ),
                    })
                  }
                  className="rounded-md bg-input px-2 py-1.5 text-[11.5px] text-foreground outline-none"
                >
                  {OPS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <input
                  placeholder="value"
                  value={String(f.value)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      filters: draft.filters.map((x, idx) =>
                        idx === i ? { ...x, value: e.target.value } : x,
                      ),
                    })
                  }
                  className="w-48 rounded-md bg-input px-2 py-1.5 text-[11.5px] text-foreground outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      filters: draft.filters.filter((_, idx) => idx !== i),
                    })
                  }
                  className="rounded-md p-1.5 text-red hover:bg-red/10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-widest text-muted/55">Result</p>
            {result && (
              <p className="text-[10.5px] text-muted/55">
                <Play className="-mt-0.5 mr-0.5 inline h-3 w-3" />
                {result.rows.length} rows · {result.ms} ms
              </p>
            )}
          </div>
          {result ? (
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-[11.5px]">
                <thead className="sticky top-0 bg-card">
                  <tr className="text-[10px] uppercase tracking-widest text-muted/45">
                    {Object.keys(result.rows[0] ?? {}).map((k) => (
                      <th key={k} className="text-left pb-1.5 pr-3 font-normal">
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.slice(0, 200).map((row, i) => (
                    <tr key={i} className="border-t border-separator/50">
                      {Object.entries(row).map(([k, v]) => (
                        <td key={k} className="py-1 pr-3 text-foreground/85">
                          {typeof v === "object" ? JSON.stringify(v).slice(0, 80) : String(v).slice(0, 80)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-[12px] text-muted/45">Configure and run a query.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
