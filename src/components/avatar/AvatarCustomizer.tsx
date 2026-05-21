import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { cn } from "@/lib/utils";
import {
  AVATAR_TRAIT_OPTIONS,
  BACKGROUND_COLORS,
  type AvatarOptions,
} from "@/lib/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";

interface AvatarCustomizerProps {
  open: boolean;
  onClose: () => void;
  initialOptions: AvatarOptions;
}

// Traits exposed in the arrow-control list, in the order they render.
type Trait = "hair" | "eyes" | "brows" | "lips" | "nose" | "body" | "gesture" | "glasses";

const TRAIT_LABELS: Record<Trait, string> = {
  hair: "Hair",
  eyes: "Eyes",
  brows: "Brows",
  lips: "Lips",
  nose: "Nose",
  body: "Body",
  gesture: "Gesture",
  glasses: "Glasses",
};

// "Glasses" supports a "None" option that maps to undefined so the trait
// isn't pinned (probability zero in the renderer).
const NULLABLE_TRAITS: Trait[] = ["glasses", "gesture"];

const TRAIT_ORDER: Trait[] = ["hair", "eyes", "brows", "lips", "nose", "body", "glasses", "gesture"];

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomizeOptions(seed: string): AvatarOptions {
  return {
    seed,
    backgroundColor: randomPick(BACKGROUND_COLORS),
    body: randomPick(AVATAR_TRAIT_OPTIONS.body),
    brows: randomPick(AVATAR_TRAIT_OPTIONS.brows),
    eyes: randomPick(AVATAR_TRAIT_OPTIONS.eyes),
    hair: randomPick(AVATAR_TRAIT_OPTIONS.hair),
    lips: randomPick(AVATAR_TRAIT_OPTIONS.lips),
    nose: randomPick(AVATAR_TRAIT_OPTIONS.nose),
    // 50/50 for glasses, otherwise leave undefined.
    glasses: Math.random() < 0.5 ? randomPick(AVATAR_TRAIT_OPTIONS.glasses) : undefined,
    // 40% chance of a gesture so the avatar isn't always waving.
    gesture: Math.random() < 0.4 ? randomPick(AVATAR_TRAIT_OPTIONS.gesture) : undefined,
  };
}

export function AvatarCustomizer({ open, onClose, initialOptions }: AvatarCustomizerProps) {
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  const [draft, setDraft] = useState<AvatarOptions>(initialOptions);

  // Reset draft each time the modal opens so cancel reverts cleanly.
  useEffect(() => {
    if (open) setDraft(initialOptions);
  }, [open, initialOptions]);

  const handleSave = () => {
    updateAvatar(draft);
    toast.success("Avatar updated");
    onClose();
  };

  const handleRandomize = () => {
    setDraft(randomizeOptions(draft.seed));
  };

  return (
    <Modal open={open} onClose={onClose} title="Customize avatar" maxWidth="max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* Preview column */}
        <div className="flex flex-col items-center gap-4">
          <UserAvatar
            options={draft}
            size={200}
            className="border border-separator bg-card"
          />
          <button
            onClick={handleRandomize}
            className="inline-flex items-center gap-2 rounded-lg border border-separator bg-card px-3 py-1.5 text-[12px] font-medium text-foreground/80 hover:bg-card-active transition-colors"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Randomize
          </button>
        </div>

        {/* Controls column */}
        <div className="flex flex-col gap-4 max-h-[55vh] overflow-y-auto pr-1">
          {TRAIT_ORDER.map((trait) => (
            <TraitArrowControl
              key={trait}
              label={TRAIT_LABELS[trait]}
              value={draft[trait]}
              options={AVATAR_TRAIT_OPTIONS[trait]}
              nullable={NULLABLE_TRAITS.includes(trait)}
              onChange={(next) => setDraft((d) => ({ ...d, [trait]: next }))}
            />
          ))}

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted/60">
              Background
            </p>
            <div className="flex flex-wrap gap-2">
              {BACKGROUND_COLORS.map((color) => {
                const active = color === draft.backgroundColor;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, backgroundColor: color }))}
                    aria-label={`Background ${color}`}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-all",
                      active
                        ? "border-foreground scale-110"
                        : "border-separator hover:scale-105",
                    )}
                    style={{ backgroundColor: `#${color}` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2 border-t border-separator pt-4">
        <Button variant="secondary" size="md" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="md" onClick={handleSave}>
          Save
        </Button>
      </div>
    </Modal>
  );
}

interface TraitArrowControlProps {
  label: string;
  value: string | undefined;
  options: string[];
  nullable: boolean;
  onChange: (next: string | undefined) => void;
}

function TraitArrowControl({
  label,
  value,
  options,
  nullable,
  onChange,
}: TraitArrowControlProps) {
  // Build the pool the arrows cycle through. If nullable, prepend a "None"
  // sentinel slot (`undefined`).
  const pool: (string | undefined)[] = nullable ? [undefined, ...options] : options;
  const currentIndex = pool.findIndex((v) => v === value);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  const move = (delta: number) => {
    const next = (safeIndex + delta + pool.length) % pool.length;
    onChange(pool[next]);
  };

  const displayText = value ?? "None";

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-[12px] font-semibold uppercase tracking-widest text-muted/60 w-20 shrink-0">
        {label}
      </p>
      <div className="flex flex-1 items-center justify-between rounded-lg border border-separator bg-card px-2 py-1.5">
        <button
          type="button"
          onClick={() => move(-1)}
          className="rounded-md p-1 text-muted hover:bg-input hover:text-foreground/80 transition-colors"
          aria-label={`Previous ${label}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[12px] font-mono tabular-nums text-foreground/80">
          {displayText}
        </span>
        <button
          type="button"
          onClick={() => move(1)}
          className="rounded-md p-1 text-muted hover:bg-input hover:text-foreground/80 transition-colors"
          aria-label={`Next ${label}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
