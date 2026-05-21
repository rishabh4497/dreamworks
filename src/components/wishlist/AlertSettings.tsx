import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useWishlistStore } from "@/stores/wishlist-store";
import { toast } from "@/stores/toast-store";
import type { GameId, WishlistEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

type Mode = "any-sale" | "below-price" | "atl-only";

interface AlertSettingsProps {
  gameId: GameId;
  gameName: string;
  open: boolean;
  onClose: () => void;
}

function modeFromEntry(entry: WishlistEntry | undefined): Mode {
  if (!entry) return "any-sale";
  if (entry.notifyOnlyAtATL) return "atl-only";
  if (typeof entry.priceCeilingCents === "number") return "below-price";
  return "any-sale";
}

export function AlertSettings({ gameId, gameName, open, onClose }: AlertSettingsProps) {
  const entry = useWishlistStore((s) => s.getEntry(gameId));
  const updateEntry = useWishlistStore((s) => s.updateEntry);

  const [mode, setMode] = useState<Mode>(() => modeFromEntry(entry));
  const [dollarsInput, setDollarsInput] = useState<string>(() =>
    typeof entry?.priceCeilingCents === "number"
      ? (entry.priceCeilingCents / 100).toFixed(2)
      : "19.99",
  );

  // Re-sync when the modal opens with a (possibly different) entry.
  useEffect(() => {
    if (!open) return;
    setMode(modeFromEntry(entry));
    setDollarsInput(
      typeof entry?.priceCeilingCents === "number"
        ? (entry.priceCeilingCents / 100).toFixed(2)
        : "19.99",
    );
  }, [open, entry]);

  const onSave = () => {
    if (mode === "any-sale") {
      updateEntry(gameId, {
        priceCeilingCents: undefined,
        notifyOnlyAtATL: false,
        notifyOnSale: true,
        lastAlertedAt: undefined,
      });
      toast.success("Alert set: any sale");
    } else if (mode === "below-price") {
      const dollars = Number.parseFloat(dollarsInput);
      if (!Number.isFinite(dollars) || dollars < 0) {
        toast.error("Enter a valid target price");
        return;
      }
      updateEntry(gameId, {
        priceCeilingCents: Math.round(dollars * 100),
        notifyOnlyAtATL: false,
        notifyOnSale: true,
        lastAlertedAt: undefined,
      });
      toast.success(`Alert set: under $${dollars.toFixed(2)}`);
    } else {
      updateEntry(gameId, {
        priceCeilingCents: undefined,
        notifyOnlyAtATL: true,
        notifyOnSale: true,
        lastAlertedAt: undefined,
      });
      toast.success("Alert set: all-time low only");
    }
    onClose();
  };

  const onClear = () => {
    updateEntry(gameId, {
      priceCeilingCents: undefined,
      notifyOnlyAtATL: false,
      notifyOnSale: false,
      lastAlertedAt: undefined,
    });
    toast.info("Alerts cleared");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Alert me when…`}>
      <p className="mb-4 text-[12px] text-muted/70">
        Fine-tune notifications for{" "}
        <span className="text-foreground/90 font-medium">{gameName}</span>.
      </p>

      <div className="flex flex-col gap-2">
        <RadioRow
          checked={mode === "any-sale"}
          onChange={() => setMode("any-sale")}
          label="Any sale"
          description="Notify whenever the price drops below the base price."
        />
        <RadioRow
          checked={mode === "below-price"}
          onChange={() => setMode("below-price")}
          label="Below a target price"
          description="Only alert me when the final price drops to (or below) my target."
        >
          {mode === "below-price" && (
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[12px] text-muted/70">USD</span>
              <span className="text-[12px] text-muted/70">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                value={dollarsInput}
                onChange={(e) => setDollarsInput(e.target.value)}
                className="w-28 rounded-lg border border-separator bg-input px-2 py-1.5 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-acid/40"
              />
            </div>
          )}
        </RadioRow>
        <RadioRow
          checked={mode === "atl-only"}
          onChange={() => setMode("atl-only")}
          label="At all-time low only"
          description="Strictest setting — fires only when the current price ties or beats the lowest ever."
        />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onClear}
          className="text-[12px] text-muted/70 hover:text-foreground/80 underline-offset-2 hover:underline"
        >
          Clear alert
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-separator bg-card px-3 py-1.5 text-[12px] text-muted hover:bg-card-active hover:text-foreground/80"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="rounded-md bg-acid px-3 py-1.5 text-[12px] font-semibold text-background hover:brightness-110"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RadioRow({
  checked,
  onChange,
  label,
  description,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "rounded-xl border px-3 py-3 text-left transition-colors",
        checked
          ? "border-acid/40 bg-acid/5"
          : "border-separator bg-card hover:bg-card-active",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "mt-[3px] inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
            checked ? "border-acid" : "border-separator",
          )}
        >
          {checked && <span className="h-1.5 w-1.5 rounded-full bg-acid" />}
        </span>
        <div className="flex-1">
          <p className="text-[13px] font-medium text-foreground">{label}</p>
          <p className="mt-0.5 text-[11px] text-muted/70">{description}</p>
          {children}
        </div>
      </div>
    </button>
  );
}
