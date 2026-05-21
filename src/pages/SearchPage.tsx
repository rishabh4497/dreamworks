import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { GameCard } from "@/components/store/GameCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "@/hooks/use-games";
import { useCategories, useTags } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";

const PLATFORMS = ["windows", "mac", "linux"] as const;

export function SearchPage() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [genres, setGenres] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);

  const filters = useMemo(
    () => ({ q, genres, tags, platforms, onSaleOnly, freeOnly }),
    [q, genres, tags, platforms, onSaleOnly, freeOnly],
  );
  const { data, isLoading } = useSearch(filters);
  const cats = useCategories();
  const allTags = useTags();

  const toggle = (list: string[], val: string, setter: (n: string[]) => void) => {
    if (list.includes(val)) setter(list.filter((x) => x !== val));
    else setter([...list, val]);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search games…"
        />
        <FilterGroup title="Filters">
          <Checkbox label="On sale" checked={onSaleOnly} onChange={setOnSaleOnly} />
          <Checkbox label="Free to play" checked={freeOnly} onChange={setFreeOnly} />
        </FilterGroup>
        <FilterGroup title="Platforms">
          {PLATFORMS.map((p) => (
            <Checkbox
              key={p}
              label={p}
              checked={platforms.includes(p)}
              onChange={() => toggle(platforms, p, setPlatforms)}
            />
          ))}
        </FilterGroup>
        <FilterGroup title="Genres">
          {(cats.data ?? []).map((c) => (
            <Checkbox
              key={c.slug}
              label={c.name}
              checked={genres.includes(c.slug)}
              onChange={() => toggle(genres, c.slug, setGenres)}
            />
          ))}
        </FilterGroup>
        <FilterGroup title="Popular tags">
          {(allTags.data ?? []).slice(0, 14).map((t) => (
            <Checkbox
              key={t.slug}
              label={t.name}
              checked={tags.includes(t.slug)}
              onChange={() => toggle(tags, t.slug, setTags)}
            />
          ))}
        </FilterGroup>
      </aside>

      <div>
        <p className="text-[12px] text-muted/60 mb-3">
          {isLoading ? "Searching…" : `${data?.length ?? 0} results`}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[210px] w-full" />
              ))
            : (data ?? []).map((g) => (
                <GameCard key={g.id} game={g} width="100%" />
              ))}
        </div>
      </div>
    </motion.div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted/50 mb-1.5">
        {title}
      </p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] transition-colors capitalize",
        checked
          ? "bg-card-active text-foreground"
          : "text-muted/70 hover:bg-input hover:text-foreground/80",
      )}
    >
      {label}
      <span
        className={cn(
          "h-3.5 w-3.5 rounded border",
          checked ? "border-acid bg-acid" : "border-separator",
        )}
      />
    </button>
  );
}
