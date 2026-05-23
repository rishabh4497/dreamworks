import { cn } from "@/lib/utils";
import { useConsoleRange } from "@/hooks/use-console";
import type { ConsoleRange } from "@/lib/types";

const OPTIONS: { value: ConsoleRange; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
];

export function ConsoleRangeSelector() {
  const [range, setRange] = useConsoleRange();
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-input p-1">
      {OPTIONS.map((opt) => {
        const active = range === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRange(opt.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
              active
                ? "bg-card-active text-foreground"
                : "text-muted/65 hover:text-foreground/80",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
