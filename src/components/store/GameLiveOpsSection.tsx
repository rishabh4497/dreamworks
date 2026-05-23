import { Calendar, Megaphone, Pin } from "lucide-react";
import { useAnnouncementsByApp } from "@/hooks/use-announcements";
import { useLiveEventsByApp } from "@/hooks/use-live-events";
import { isActive, isUpcoming } from "@/lib/api/live-events";
import type { Announcement } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const CAT_STYLES: Record<Announcement["category"], string> = {
  patch: "bg-cyan/10 text-cyan",
  event: "bg-acid/10 text-acid",
  news: "bg-green/10 text-green",
  maintenance: "bg-orange/10 text-orange",
};

function isPinned(a: Announcement, nowMs = Date.now()): boolean {
  return !!a.pinnedUntil && new Date(a.pinnedUntil).getTime() > nowMs;
}

export function GameLiveOpsSection({ appId }: { appId: string }) {
  const annQ = useAnnouncementsByApp(appId);
  const evtQ = useLiveEventsByApp(appId);

  const ann = (annQ.data ?? []).slice().sort((a, b) => {
    if (isPinned(a) !== isPinned(b)) return isPinned(a) ? -1 : 1;
    return a.publishedAt < b.publishedAt ? 1 : -1;
  });
  const activeEvents = (evtQ.data ?? []).filter((e) => isActive(e));
  const upcomingEvents = (evtQ.data ?? []).filter((e) => isUpcoming(e)).slice(0, 3);

  if (ann.length === 0 && activeEvents.length === 0 && upcomingEvents.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 space-y-4">
      <h2 className="flex items-center gap-2 text-[18px] font-semibold text-foreground">
        <Megaphone className="h-4 w-4 text-acid" /> What's new
      </h2>

      {activeEvents.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-green">
            Live now
          </p>
          {activeEvents.map((e) => (
            <div
              key={e.id}
              className="rounded-2xl border border-green/30 bg-green/5 p-4"
            >
              <p className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-green" /> {e.title}
              </p>
              <p className="mt-1 text-[12px] text-muted/75">{e.description}</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-muted/55">
                Ends {new Date(e.endsAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {ann.slice(0, 6).map((a) => (
          <article
            key={a.id}
            className="rounded-2xl border border-separator bg-card p-4"
          >
            <header className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${CAT_STYLES[a.category]}`}
              >
                {a.category}
              </span>
              {isPinned(a) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-acid">
                  <Pin className="h-3 w-3" /> Pinned
                </span>
              )}
              <h3 className="text-[14px] font-semibold text-foreground">{a.title}</h3>
              <span className="ml-auto text-[11px] text-muted/55">
                {formatDate(a.publishedAt)}
              </span>
            </header>
            {a.heroImageUrl && (
              <img
                src={a.heroImageUrl}
                alt=""
                className="mt-3 aspect-[16/6] w-full rounded-xl border border-separator object-cover"
              />
            )}
            <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/85">
              {a.body}
            </p>
          </article>
        ))}
      </div>

      {upcomingEvents.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted/55">
            Coming up
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {upcomingEvents.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border border-separator bg-card p-3"
              >
                <p className="text-[13px] font-semibold text-foreground">{e.title}</p>
                <p className="mt-0.5 text-[11px] text-muted/65">{e.description}</p>
                <p className="mt-1.5 text-[10px] uppercase tracking-widest text-muted/55">
                  {new Date(e.startsAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
