import { cn } from "@/lib/utils";

export type LibraryTab = "games" | "tools";

interface LibraryTabsProps {
  active: LibraryTab;
  onChange: (tab: LibraryTab) => void;
}

const TABS: Array<{ key: LibraryTab; label: string }> = [
  { key: "games", label: "Games" },
  { key: "tools", label: "Tools" },
];

export function LibraryTabs({ active, onChange }: LibraryTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Library sections"
      className="inline-flex gap-1 rounded-xl border border-separator bg-card p-1"
    >
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-[12px] font-semibold transition-colors",
              isActive
                ? "bg-acid/10 text-acid"
                : "text-muted/80 hover:text-foreground/90 hover:bg-card-active",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
