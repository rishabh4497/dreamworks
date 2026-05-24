import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

export function useCompareToggle(): [boolean, (next: boolean) => void] {
  const [params, setParams] = useSearchParams();
  const on = params.get("compare") === "1";
  const setOn = (next: boolean) => {
    const updated = new URLSearchParams(params);
    if (next) updated.set("compare", "1");
    else updated.delete("compare");
    setParams(updated, { replace: true });
  };
  return [on, setOn];
}

export function ConsoleCompareToggle() {
  const [on, setOn] = useCompareToggle();
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className={cn(
        "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
        on
          ? "bg-acid/15 text-acid"
          : "bg-card-active text-muted/65 hover:text-foreground/80",
      )}
      title="Overlay previous range on each chart"
    >
      {on ? "Comparing" : "Compare"}
    </button>
  );
}
