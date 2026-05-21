import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGames } from "@/hooks/use-games";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function CalendarPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const { data: games } = useGames();

  const events = useMemo(() => {
    const releases = (games ?? []).map((g) => ({
      type: "release" as const,
      date: new Date(g.releaseDate),
      label: g.name,
      gameId: g.id,
    }));
    const sales = (games ?? [])
      .filter((g) => g.price.discountEndsAt)
      .map((g) => ({
        type: "sale" as const,
        date: new Date(g.price.discountEndsAt!),
        label: `${g.name} sale ends`,
        gameId: g.id,
      }));
    return [...releases, ...sales].filter(
      (e) => e.date.getFullYear() === cursor.getFullYear() && e.date.getMonth() === cursor.getMonth(),
    );
  }, [games, cursor]);

  const offsetStart = startOfMonth(cursor).getDay();
  const total = daysInMonth(cursor);
  const cells: (number | null)[] = [
    ...Array.from({ length: offsetStart }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  const eventsByDay = new Map<number, typeof events>();
  for (const e of events) {
    const d = e.date.getDate();
    if (!eventsByDay.has(d)) eventsByDay.set(d, []);
    eventsByDay.get(d)!.push(e);
  }

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted/50">DB · Calendar</p>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">{monthLabel}</h1>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded-md border border-separator bg-card p-2 text-muted hover:bg-card-active"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded-md border border-separator bg-card p-2 text-muted hover:bg-card-active"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="rounded-xl border border-separator bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-separator">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-[10px] uppercase tracking-widest text-muted/50">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, idx) => (
            <div
              key={idx}
              className={cn(
                "min-h-[88px] border-b border-r border-separator p-2",
                idx % 7 === 6 && "border-r-0",
              )}
            >
              {d && (
                <>
                  <p className="text-[11px] font-mono text-muted/60">{d}</p>
                  <div className="mt-1 space-y-1">
                    {(eventsByDay.get(d) ?? []).slice(0, 2).map((e, i) => (
                      <Link
                        key={i}
                        to={ROUTES.gameDetail(e.gameId)}
                        className={cn(
                          "block truncate rounded-md px-1.5 py-[2px] text-[10px] font-medium",
                          e.type === "release"
                            ? "bg-positive/15 text-positive"
                            : "bg-discount-bg/40 text-discount-fg",
                        )}
                      >
                        {e.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
