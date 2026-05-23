import { useRef, type FormEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  value: string;
  onChange: (next: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  /** When true, render a small spinner inside the send button. */
  busy?: boolean;
  /** Hide the auto-grow textarea border (used for embedded usages). */
  variant?: "card" | "flat";
}

const MAX_HEIGHT = 140;

/**
 * Auto-growing textarea + send button. Enter submits; shift+Enter inserts a
 * newline. Height grows up to `MAX_HEIGHT` then scrolls.
 *
 * Kept presentational — the parent owns `value`/`onChange` so it can replay
 * the message into a chat array and clear the field after send.
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  placeholder = "Send a message…",
  disabled = false,
  busy = false,
  variant = "card",
}: ChatComposerProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const canSend = !disabled && !busy && value.trim().length > 0;

  const submit = (event?: FormEvent | KeyboardEvent) => {
    event?.preventDefault();
    if (!canSend) return;
    onSend();
    // Reset auto-grow after send.
    if (ref.current) ref.current.style.height = "auto";
  };

  const handleChange = (text: string) => {
    onChange(text);
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${Math.min(ref.current.scrollHeight, MAX_HEIGHT)}px`;
    }
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "flex items-end gap-2 rounded-2xl p-2 transition-colors",
        variant === "card"
          ? "border border-separator bg-input focus-within:border-acid/40"
          : "bg-transparent",
      )}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) submit(e);
        }}
        rows={1}
        placeholder={placeholder}
        disabled={disabled}
        className="max-h-[140px] min-h-[24px] flex-1 resize-none bg-transparent px-2 py-1 text-[13px] leading-relaxed text-foreground placeholder:text-muted/40 focus:outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-acid text-background transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? (
          <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-background/30 border-t-background" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
    </form>
  );
}
