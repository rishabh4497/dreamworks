import { Bell } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useNotificationsStore } from "@/stores/notifications-store";

interface NotificationBellProps {
  open: boolean;
  onToggle: () => void;
}

/**
 * Bell icon button rendered in the topbar between the wishlist and cart icons.
 * Displays a small red chip with the unread count (≤9 numeric, "9+" otherwise).
 * Click toggles the panel — panel state is owned by the topbar so the bell
 * stays a pure visual.
 */
export const NotificationBell = forwardRef<HTMLButtonElement, NotificationBellProps>(
  function NotificationBell({ open, onToggle }, ref) {
    const unreadCount = useNotificationsStore((s) => s.unreadCount);
    const chip = unreadCount > 9 ? "9+" : String(unreadCount);
    const hasUnread = unreadCount > 0;

    return (
      <button
        ref={ref}
        type="button"
        onClick={onToggle}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "relative rounded-lg p-2 text-muted transition-colors",
          "hover:bg-input hover:text-foreground/80",
          open && "bg-input text-foreground/80",
        )}
      >
        <Bell className="h-4 w-4" />
        {hasUnread && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-red px-1 text-[9px] font-bold text-white"
            aria-hidden="true"
          >
            {chip}
          </span>
        )}
      </button>
    );
  },
);
