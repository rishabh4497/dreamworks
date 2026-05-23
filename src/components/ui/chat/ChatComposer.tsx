import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { Send, Smile, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  value: string;
  onChange: (next: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  /** When true, render a spinner in place of the send icon. */
  busy?: boolean;
  /** Show keyboard hint beneath the composer (Enter to send, Shift+Enter for newline). */
  showHint?: boolean;
  /** Optional max character count — surfaces a counter when ≥ 70% full. */
  maxLength?: number;
  /** Wire up a "focus on mount" so opening a chat snaps the cursor into place. */
  autoFocus?: boolean;
  variant?: "card" | "flat";
}

const MAX_HEIGHT = 160;

/**
 * Multi-line composer with auto-grow, Enter-to-send, and Shift+Enter newline.
 *
 * Styled to match iMessage / Slack: rounded pill container, icon row on the
 * left for future attachment/emoji affordances (currently inert), prominent
 * send button on the right that morphs from disabled → active as you type.
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  placeholder = "Send a message…",
  disabled = false,
  busy = false,
  showHint = true,
  maxLength,
  autoFocus = false,
  variant = "card",
}: ChatComposerProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const canSend = !disabled && !busy && value.trim().length > 0;

  // Auto-grow the textarea up to MAX_HEIGHT; runs on every value change so
  // controlled-from-outside resets (e.g. after send) also reset the height.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
    }
  }, [autoFocus]);

  const submit = (event?: FormEvent | KeyboardEvent) => {
    event?.preventDefault();
    if (!canSend) return;
    onSend();
  };

  const charPct = maxLength ? value.length / maxLength : 0;
  const showCounter = maxLength != null && charPct >= 0.7;
  const overLimit = maxLength != null && value.length > maxLength;

  return (
    <div className="flex flex-col gap-1.5">
      <form
        onSubmit={submit}
        className={cn(
          "flex items-end gap-2 rounded-2xl p-1.5 transition-all",
          variant === "card"
            ? "border border-separator bg-input focus-within:border-acid/50 focus-within:shadow-[0_0_0_3px_rgba(var(--color-acid-rgb),0.08)]"
            : "bg-transparent",
        )}
      >
        {/* Icon row — future-facing affordances kept inert so they read as */}
        {/* "richer composer" without breaking when clicked. */}
        <div className="flex shrink-0 gap-0.5 pb-1.5">
          <ComposerIconButton aria-label="Add attachment" disabled>
            <Paperclip className="h-4 w-4" />
          </ComposerIconButton>
          <ComposerIconButton aria-label="Pick emoji" disabled>
            <Smile className="h-4 w-4" />
          </ComposerIconButton>
        </div>

        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              submit(e);
            }
          }}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength ? maxLength + 200 : undefined}
          className="max-h-[160px] min-h-[28px] flex-1 resize-none bg-transparent px-1.5 py-1.5 text-[13.5px] leading-relaxed text-foreground placeholder:text-muted/40 focus:outline-none disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!canSend || overLimit}
          aria-label="Send message"
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
            canSend && !overLimit
              ? "bg-acid text-background shadow-sm shadow-acid/30 hover:brightness-110 active:scale-95"
              : "bg-card-active text-muted/40",
          )}
        >
          {busy ? (
            <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>

      {(showHint || showCounter) && (
        <div className="flex items-center justify-between px-1 text-[10px] text-muted/45">
          <span>
            {showHint && (
              <>
                <kbd className="rounded border border-separator bg-card-active/40 px-1 py-[1px] font-mono text-[9px] text-muted/60">
                  Enter
                </kbd>{" "}
                to send,{" "}
                <kbd className="rounded border border-separator bg-card-active/40 px-1 py-[1px] font-mono text-[9px] text-muted/60">
                  Shift+Enter
                </kbd>{" "}
                for newline
              </>
            )}
          </span>
          {showCounter && (
            <span className={cn(overLimit ? "text-red" : charPct >= 0.9 ? "text-orange" : "")}>
              {value.length}
              {maxLength ? ` / ${maxLength}` : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ComposerIconButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted/55 transition-colors hover:bg-card-active hover:text-foreground/80 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted/55"
    >
      {children}
    </button>
  );
}
