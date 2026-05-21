import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  DownloadCloud,
  Info,
  Tag,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn, relativeDate } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { useNotificationsStore } from "@/stores/notifications-store";
import type { AppNotification, NotificationKind } from "@/lib/types";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  /**
   * Optional anchor element — when set, the click-outside handler ignores
   * mousedown on the anchor (so the bell-toggle doesn't immediately reopen).
   */
  anchorRef?: React.RefObject<HTMLElement | null>;
}

type FilterValue = "all" | "wishlist" | "friends" | "system";

const FILTERS: { value: FilterValue; label: string; kinds: NotificationKind[] }[] = [
  { value: "all", label: "All", kinds: [] },
  { value: "wishlist", label: "Wishlist", kinds: ["wishlist-alert", "sale-ending"] },
  { value: "friends", label: "Friends", kinds: ["friend-activity"] },
  { value: "system", label: "System", kinds: ["system", "library-import", "achievement-unlock"] },
];

const ICON_BY_KIND: Record<NotificationKind, LucideIcon> = {
  "wishlist-alert": Bell,
  "sale-ending": Tag,
  "friend-activity": Users,
  "achievement-unlock": Trophy,
  "library-import": DownloadCloud,
  system: Info,
};

export function NotificationPanel({ open, onClose, anchorRef }: NotificationPanelProps) {
  const navigate = useNavigate();
  const notifications = useNotificationsStore((s) => s.notifications);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const clear = useNotificationsStore((s) => s.clear);

  const [filter, setFilter] = useState<FilterValue>("all");
  const panelRef = useRef<HTMLDivElement>(null);

  // Click-outside dismissal. Ignore mousedown on the anchor (the bell button)
  // so toggling doesn't bounce — the bell's own onClick already handles that.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (panelRef.current?.contains(target ?? null)) return;
      if (anchorRef?.current && target && anchorRef.current.contains(target)) return;
      onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, anchorRef]);

  // Reset the filter chip whenever the panel closes so the next open is clean.
  useEffect(() => {
    if (!open) setFilter("all");
  }, [open]);

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.value === filter);
    if (!f || f.kinds.length === 0) return notifications;
    return notifications.filter((n) => f.kinds.includes(n.kind));
  }, [notifications, filter]);

  const onRowClick = (n: AppNotification) => {
    if (!n.read) markRead(n.id);
    if (n.href) {
      onClose();
      navigate(n.href);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn(
            "absolute right-0 top-full mt-2 z-50 w-[480px] max-w-[calc(100vw-2rem)]",
            "rounded-xl border border-separator bg-background shadow-2xl shadow-black/60 ring-1 ring-white/[0.04]",
            "flex flex-col overflow-hidden",
          )}
          style={{ maxHeight: 480 }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-separator px-4 py-3">
            <h3 className="text-[13px] font-semibold text-foreground">Notifications</h3>
            <button
              type="button"
              onClick={() => markAllRead()}
              className="text-[11px] font-medium text-acid hover:underline disabled:opacity-40 disabled:hover:no-underline"
              disabled={notifications.every((n) => n.read)}
            >
              Mark all read
            </button>
          </div>

          <div className="flex gap-1.5 border-b border-separator px-4 py-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  filter === f.value
                    ? "bg-acid/15 text-acid"
                    : "text-muted/70 hover:bg-input hover:text-foreground/80",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                <Bell className="h-6 w-6 text-muted/40" />
                <p className="text-[12px] text-muted/60">
                  {notifications.length === 0
                    ? "You're all caught up."
                    : "No notifications in this filter."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-separator">
                {filtered.map((n) => {
                  const Icon = ICON_BY_KIND[n.kind];
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => onRowClick(n)}
                        className={cn(
                          "flex w-full gap-3 px-4 py-3 text-left transition-colors",
                          "hover:bg-card-hover",
                          !n.read && "border-l-2 border-acid bg-acid/[0.03]",
                          n.read && "border-l-2 border-transparent",
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          <Icon className={cn("h-4 w-4", n.read ? "text-muted/60" : "text-acid")} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-[12.5px] leading-snug",
                              n.read ? "font-medium text-foreground/80" : "font-semibold text-foreground",
                            )}
                          >
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="mt-0.5 text-[11.5px] leading-snug text-muted/70 line-clamp-2">
                              {n.body}
                            </p>
                          )}
                          <p className="mt-1 text-[10.5px] text-muted/50">{relativeDate(n.createdAt)}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-separator px-4 py-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(ROUTES.settings);
              }}
              className="text-[11px] font-medium text-muted/80 hover:text-foreground/90"
            >
              Notification settings →
            </button>
            <button
              type="button"
              onClick={() => clear()}
              className="text-[11px] font-medium text-muted/70 hover:text-red disabled:opacity-40 disabled:hover:text-muted/70"
              disabled={notifications.length === 0}
            >
              Clear all
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
