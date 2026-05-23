import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/**
 * Styled confirmation dialog. Use instead of `window.confirm()` so the
 * confirmation honors theme + focus management + matches the rest of the UI.
 */
export function ConfirmModal({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      {description && (
        <p className="mb-5 text-[13px] leading-relaxed text-muted/80">{description}</p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-separator bg-card px-3 py-1.5 text-[12px] text-muted hover:bg-card-active hover:text-foreground/80"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
          }}
          className={cn(
            "rounded-md px-3 py-1.5 text-[12px] font-semibold transition-all hover:brightness-110",
            destructive
              ? "border border-red/30 bg-red/15 text-red"
              : "bg-acid text-background",
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
