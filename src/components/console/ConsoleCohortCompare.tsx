import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useCohortCompare } from "@/hooks/use-console-advanced";
import type { ConsoleRange } from "@/lib/types";

type Cohort = "desktop" | "web" | "new" | "returning";
const COHORTS: Cohort[] = ["desktop", "web", "new", "returning"];

interface Props {
  range: ConsoleRange;
}

export function ConsoleCohortCompare({ range }: Props) {
  const [a, setA] = useState<Cohort>("desktop");
  const [b, setB] = useState<Cohort>("web");
  const { data: result } = useCohortCompare(a, b, range);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <p className="text-[11px] uppercase tracking-widest text-muted/55">Compare</p>
          <select
            value={a}
            onChange={(e) => setA(e.target.value as Cohort)}
            className="rounded-md bg-input px-2 py-1.5 text-[12px] text-foreground outline-none"
          >
            {COHORTS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <span className="text-muted/55">vs</span>
          <select
            value={b}
            onChange={(e) => setB(e.target.value as Cohort)}
            className="rounded-md bg-input px-2 py-1.5 text-[12px] text-foreground outline-none"
          >
            {COHORTS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        {result ? (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-widest text-muted/45">
                <th className="text-left font-normal pb-1.5">Metric</th>
                <th className="text-right font-normal pb-1.5 pr-2">{result.cohortAName}</th>
                <th className="text-right font-normal pb-1.5 pr-2">{result.cohortBName}</th>
                <th className="text-right font-normal pb-1.5">Δ</th>
              </tr>
            </thead>
            <tbody>
              {result.metrics.map((m) => (
                <tr key={m.label} className="border-t border-separator/50">
                  <td className="py-1.5 text-foreground/85">{m.label}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-muted/70">{m.a.toLocaleString()}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-muted/70">{m.b.toLocaleString()}</td>
                  <td
                    className={`py-1.5 text-right tabular-nums ${
                      m.deltaPct === 0
                        ? "text-muted/55"
                        : m.deltaPct > 0
                          ? "text-green/85"
                          : "text-red/85"
                    }`}
                  >
                    {m.deltaPct >= 0 ? "+" : ""}
                    {m.deltaPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="py-6 text-center text-[12px] text-muted/55">Loading comparison…</p>
        )}
      </Card>
    </div>
  );
}
