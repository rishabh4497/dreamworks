import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SubTab {
  id: string;
  label: string;
}

interface Props {
  /** URL param key — default "sub". */
  param?: string;
  tabs: SubTab[];
  className?: string;
}

export function useSubTab(param = "sub", fallback?: string): [string, (next: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(param) || fallback || "";
  const setValue = (next: string) => {
    const updated = new URLSearchParams(params);
    updated.set(param, next);
    setParams(updated, { replace: true });
  };
  return [value, setValue];
}

export function ConsoleSubTabs({ tabs, param = "sub", className }: Props) {
  const [sub, setSub] = useSubTab(param, tabs[0]?.id);
  return (
    <nav className={cn("inline-flex items-center gap-0.5 rounded-lg bg-input p-1", className)}>
      {tabs.map((t) => {
        const active = sub === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setSub(t.id)}
            className={cn(
              "rounded-md px-3 py-1 text-[12px] font-medium transition-colors",
              active
                ? "bg-card-active text-foreground"
                : "text-muted/65 hover:text-foreground/80",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
