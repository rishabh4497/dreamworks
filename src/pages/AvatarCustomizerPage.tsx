import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Ban,
  Crown,
  FlipHorizontal,
  Glasses,
  Hash,
  Image as ImageIcon,
  Layers,
  Palette,
  PartyPopper,
  Shuffle,
  Sparkles,
  Wand2,
} from "lucide-react";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  AVATAR_PRESETS,
  AVATAR_TRAIT_OPTIONS,
  BACKGROUND_COLORS,
  DEFAULT_AVATAR_OPTIONS,
  type AvatarOptions,
  type AvatarPreset,
} from "@/lib/avatar";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

// ── Tabs ──────────────────────────────────────────────────────────────────

type TabId = "presets" | "style" | "face" | "accessories" | "background" | "vibe";

const TABS: { id: TabId; label: string; icon: typeof Sparkles }[] = [
  { id: "presets", label: "Presets", icon: PartyPopper },
  { id: "style", label: "Style", icon: Layers },
  { id: "face", label: "Face", icon: Sparkles },
  { id: "accessories", label: "Accessories", icon: Glasses },
  { id: "background", label: "Background", icon: Palette },
  { id: "vibe", label: "Vibe", icon: Wand2 },
];

// ── Randomizer ────────────────────────────────────────────────────────────

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomizeOptions(seed: string): AvatarOptions {
  const useGradient = Math.random() < 0.45;
  return {
    seed,
    backgroundColor: randomPick(BACKGROUND_COLORS),
    backgroundType: useGradient ? "gradientLinear" : "solid",
    backgroundColor2: useGradient ? randomPick(BACKGROUND_COLORS) : undefined,
    backgroundRotation: useGradient ? Math.floor(Math.random() * 360) : undefined,
    body: randomPick(AVATAR_TRAIT_OPTIONS.body),
    brows: randomPick(AVATAR_TRAIT_OPTIONS.brows),
    eyes: randomPick(AVATAR_TRAIT_OPTIONS.eyes),
    hair: randomPick(AVATAR_TRAIT_OPTIONS.hair),
    lips: randomPick(AVATAR_TRAIT_OPTIONS.lips),
    nose: randomPick(AVATAR_TRAIT_OPTIONS.nose),
    glasses: Math.random() < 0.45 ? randomPick(AVATAR_TRAIT_OPTIONS.glasses) : undefined,
    gesture: Math.random() < 0.4 ? randomPick(AVATAR_TRAIT_OPTIONS.gesture) : undefined,
    beard: Math.random() < 0.3 ? randomPick(AVATAR_TRAIT_OPTIONS.beard) : undefined,
    bodyIcon: Math.random() < 0.25 ? randomPick(AVATAR_TRAIT_OPTIONS.bodyIcon) : undefined,
    flip: Math.random() < 0.3,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────

export function AvatarCustomizerPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const updateAvatar = useAuthStore((s) => s.updateAvatar);

  const initialOptions = profile?.avatarOptions ?? DEFAULT_AVATAR_OPTIONS;
  const [draft, setDraft] = useState<AvatarOptions>(initialOptions);
  const [tab, setTab] = useState<TabId>("presets");
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const updateField = <K extends keyof AvatarOptions>(key: K, value: AvatarOptions[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const handleSurprise = () => {
    setDraft(randomizeOptions(draft.seed));
    toast.success("Re-rolled!");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAvatar(draft);
      toast.success("Avatar updated");
      navigate(ROUTES.profile);
    } catch {
      toast.error("Couldn't save avatar. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.profile)}
            className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to profile
          </button>
          <h1 className="flex items-center gap-2 text-[24px] font-semibold tracking-tight text-foreground">
            <Wand2 className="h-5 w-5 text-acid" />
            Customize your avatar
          </h1>
          <p className="mt-1 text-[13px] text-muted/70">
            Mix and match — beard, body icons, gradient backgrounds, presets. Save when it feels right.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Preview column (sticky on lg+) */}
        <PreviewCard
          draft={draft}
          displayName={profile.displayName}
          level={profile.level}
          onSurprise={handleSurprise}
        />

        {/* Controls column */}
        <div className="flex flex-col gap-4">
          <TabBar tab={tab} onTabChange={setTab} />

          <div className="min-h-[400px] rounded-2xl border border-separator bg-card/40 p-5 backdrop-blur-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: EASE }}
              >
                {tab === "presets" && <PresetsTab draft={draft} onApply={setDraft} />}
                {tab === "style" && <StyleTab draft={draft} onChange={updateField} />}
                {tab === "face" && <FaceTab draft={draft} onChange={updateField} />}
                {tab === "accessories" && <AccessoriesTab draft={draft} onChange={updateField} />}
                {tab === "background" && (
                  <BackgroundTab draft={draft} onChange={updateField} />
                )}
                {tab === "vibe" && <VibeTab draft={draft} onChange={updateField} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer actions */}
          <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 rounded-2xl border border-separator bg-card/80 p-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
            <Button variant="secondary" size="md" onClick={handleSurprise}>
              <Shuffle className="h-3.5 w-3.5" />
              Surprise me
            </Button>
            <div className="flex items-center gap-2 sm:justify-end">
              <Button variant="secondary" size="md" onClick={() => navigate(ROUTES.profile)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={() => void handleSave()} disabled={saving}>
                <Sparkles className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save avatar"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AvatarCustomizerPage;

// ── Preview card ──────────────────────────────────────────────────────────

interface PreviewCardProps {
  draft: AvatarOptions;
  displayName: string;
  level: number;
  onSurprise: () => void;
}

function PreviewCard({ draft, displayName, level, onSurprise }: PreviewCardProps) {
  // A short hash of options so motion can replay the entrance on every change.
  const hash = useMemo(
    () =>
      [
        draft.seed,
        draft.backgroundColor,
        draft.backgroundType,
        draft.backgroundColor2,
        draft.backgroundRotation,
        draft.body,
        draft.brows,
        draft.eyes,
        draft.hair,
        draft.lips,
        draft.nose,
        draft.glasses,
        draft.gesture,
        draft.beard,
        draft.bodyIcon,
        draft.flip,
      ].join("|"),
    [draft],
  );

  return (
    <div className="lg:sticky lg:top-6 lg:self-start">
      <div
        className="relative overflow-hidden rounded-3xl border border-separator bg-card/60 p-6 backdrop-blur-sm"
        style={{
          boxShadow:
            "0 24px 60px -22px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, var(--color-acid) 14%, transparent)",
        }}
      >
        {/* Festival glow */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 h-60 w-60 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-acid) 25%, transparent) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-12 -bottom-12 h-52 w-52 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-cyan) 28%, transparent) 0%, transparent 70%)",
          }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        <p className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-acid">
          <Sparkles className="h-2.5 w-2.5" />
          Live preview
        </p>
        <div className="relative mx-auto flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={hash}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
            >
              <UserAvatar
                options={draft}
                size={280}
                className="rounded-3xl border-4 border-background bg-card shadow-2xl shadow-black/40"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-5 text-center">
          <p className="text-[16px] font-semibold text-foreground">{displayName}</p>
          <p className="mt-1 inline-flex items-center justify-center gap-1 rounded-full bg-acid/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-acid">
            <Crown className="h-2.5 w-2.5" />
            Level {level}
          </p>
        </div>

        <button
          type="button"
          onClick={onSurprise}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-acid/30 bg-acid/10 px-4 py-2.5 text-[12px] font-semibold text-acid transition-colors hover:bg-acid/20"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Surprise me
        </button>
      </div>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────

interface TabBarProps {
  tab: TabId;
  onTabChange: (tab: TabId) => void;
}

function TabBar({ tab, onTabChange }: TabBarProps) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-2xl border border-separator bg-card/40 p-1.5 backdrop-blur-sm">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = t.id === tab;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={cn(
              "relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition-colors min-w-[88px]",
              active
                ? "bg-acid text-background shadow-sm shadow-acid/20"
                : "text-muted hover:bg-card-active hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Tab content ──────────────────────────────────────────────────────────

interface TabContentProps {
  draft: AvatarOptions;
  onChange: <K extends keyof AvatarOptions>(key: K, value: AvatarOptions[K]) => void;
}

function StyleTab({ draft, onChange }: TabContentProps) {
  return (
    <div className="space-y-7">
      <TraitTilePicker
        label="Hair"
        helper="63 variants + a hat. Yes, a hat."
        draft={draft}
        traitKey="hair"
        options={AVATAR_TRAIT_OPTIONS.hair}
        onChange={(v) => onChange("hair", v)}
        nullable={false}
      />
      <TraitTilePicker
        label="Body"
        helper="Outfit silhouette."
        draft={draft}
        traitKey="body"
        options={AVATAR_TRAIT_OPTIONS.body}
        onChange={(v) => onChange("body", v)}
        nullable={false}
      />
    </div>
  );
}

function FaceTab({ draft, onChange }: TabContentProps) {
  return (
    <div className="space-y-7">
      <TraitTilePicker
        label="Eyes"
        draft={draft}
        traitKey="eyes"
        options={AVATAR_TRAIT_OPTIONS.eyes}
        onChange={(v) => onChange("eyes", v)}
        nullable={false}
      />
      <TraitTilePicker
        label="Brows"
        draft={draft}
        traitKey="brows"
        options={AVATAR_TRAIT_OPTIONS.brows}
        onChange={(v) => onChange("brows", v)}
        nullable={false}
      />
      <TraitTilePicker
        label="Nose"
        draft={draft}
        traitKey="nose"
        options={AVATAR_TRAIT_OPTIONS.nose}
        onChange={(v) => onChange("nose", v)}
        nullable={false}
      />
      <TraitTilePicker
        label="Lips"
        draft={draft}
        traitKey="lips"
        options={AVATAR_TRAIT_OPTIONS.lips}
        onChange={(v) => onChange("lips", v)}
        nullable={false}
      />
    </div>
  );
}

function AccessoriesTab({ draft, onChange }: TabContentProps) {
  return (
    <div className="space-y-7">
      <TraitTilePicker
        label="Beard"
        helper="New! 12 styles to fill out the chin."
        draft={draft}
        traitKey="beard"
        options={AVATAR_TRAIT_OPTIONS.beard}
        onChange={(v) => onChange("beard", v)}
        nullable
      />
      <TraitTilePicker
        label="Glasses"
        draft={draft}
        traitKey="glasses"
        options={AVATAR_TRAIT_OPTIONS.glasses}
        onChange={(v) => onChange("glasses", v)}
        nullable
      />
      <TraitTilePicker
        label="Gesture"
        helper="Wave, point, or stay still."
        draft={draft}
        traitKey="gesture"
        options={AVATAR_TRAIT_OPTIONS.gesture}
        onChange={(v) => onChange("gesture", v)}
        nullable
      />
      <TraitTilePicker
        label="Body Icon"
        helper="A floating orbit for extra flair."
        draft={draft}
        traitKey="bodyIcon"
        options={AVATAR_TRAIT_OPTIONS.bodyIcon}
        onChange={(v) => onChange("bodyIcon", v)}
        nullable
      />
    </div>
  );
}

function BackgroundTab({ draft, onChange }: TabContentProps) {
  const isGradient = draft.backgroundType === "gradientLinear";

  return (
    <div className="space-y-6">
      {/* Solid / Gradient toggle */}
      <div>
        <SectionLabel label="Background style" />
        <div className="inline-flex rounded-xl border border-separator bg-card p-1">
          <ToggleChip
            active={!isGradient}
            onClick={() => {
              onChange("backgroundType", "solid");
              onChange("backgroundColor2", undefined);
              onChange("backgroundRotation", undefined);
            }}
          >
            Solid
          </ToggleChip>
          <ToggleChip
            active={isGradient}
            onClick={() => {
              onChange("backgroundType", "gradientLinear");
              if (!draft.backgroundColor2) onChange("backgroundColor2", BACKGROUND_COLORS[3]);
              if (draft.backgroundRotation === undefined) onChange("backgroundRotation", 90);
            }}
          >
            Gradient
          </ToggleChip>
        </div>
      </div>

      {/* Primary swatches */}
      <div>
        <SectionLabel label={isGradient ? "Color 1" : "Color"} />
        <SwatchGrid
          value={draft.backgroundColor}
          onChange={(c) => onChange("backgroundColor", c)}
        />
      </div>

      {/* Gradient extras */}
      {isGradient && (
        <>
          <div>
            <SectionLabel label="Color 2" />
            <SwatchGrid
              value={draft.backgroundColor2 ?? BACKGROUND_COLORS[3]}
              onChange={(c) => onChange("backgroundColor2", c)}
            />
          </div>
          <div>
            <SectionLabel
              label="Rotation"
              hint={`${draft.backgroundRotation ?? 0}°`}
            />
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={359}
                value={draft.backgroundRotation ?? 0}
                onChange={(e) => onChange("backgroundRotation", Number(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-input accent-acid"
              />
              <div
                className="h-12 w-12 shrink-0 rounded-xl border border-separator"
                style={{
                  background: `linear-gradient(${(draft.backgroundRotation ?? 0) + 90}deg, #${draft.backgroundColor}, #${draft.backgroundColor2 ?? draft.backgroundColor})`,
                }}
                aria-label="Gradient preview"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function VibeTab({ draft, onChange }: TabContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-separator bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-acid/15 text-acid">
            <FlipHorizontal className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">Mirror</p>
            <p className="text-[11px] text-muted/70">Flip the avatar horizontally.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange("flip", !draft.flip)}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            draft.flip ? "bg-acid" : "bg-input",
          )}
          aria-pressed={!!draft.flip}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all",
              draft.flip ? "left-[22px]" : "left-0.5",
            )}
          />
        </button>
      </div>

      <div className="rounded-xl border border-separator bg-card p-4">
        <SectionLabel
          label="Seed"
          hint="Drives any trait you haven't pinned."
        />
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted" />
          <input
            value={draft.seed}
            onChange={(e) => onChange("seed", e.target.value)}
            className="flex-1 rounded-lg border border-separator bg-input px-3 py-2 text-[13px] font-mono text-foreground focus:border-acid/40 focus:outline-none focus:ring-1 focus:ring-acid/15"
          />
          <button
            type="button"
            onClick={() => onChange("seed", Math.random().toString(36).slice(2, 10))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-separator bg-card px-3 py-2 text-[12px] font-medium text-muted hover:bg-card-active hover:text-foreground"
          >
            <Shuffle className="h-3.5 w-3.5" />
            New seed
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-acid/20 bg-acid/5 p-4">
        <Wand2 className="mt-0.5 h-4 w-4 text-acid" />
        <p className="text-[12px] leading-relaxed text-muted/80">
          Tip — try <span className="font-semibold text-foreground">Surprise me</span> for a fully random combo, or pick a <span className="font-semibold text-foreground">Preset</span> and tweak from there.
        </p>
      </div>
    </div>
  );
}

// ── Presets tab ───────────────────────────────────────────────────────────

interface PresetsTabProps {
  draft: AvatarOptions;
  onApply: (next: AvatarOptions) => void;
}

function PresetsTab({ draft, onApply }: PresetsTabProps) {
  const activeId = useMemo(() => findActivePreset(draft), [draft]);

  return (
    <div>
      <p className="mb-4 text-[12px] text-muted/70">
        Hand-curated combos. Click one to apply the whole look — then tweak from any tab.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {AVATAR_PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            seed={draft.seed}
            active={preset.id === activeId}
            onApply={() => onApply({ seed: draft.seed, ...preset.options })}
          />
        ))}
      </div>
    </div>
  );
}

interface PresetCardProps {
  preset: AvatarPreset;
  seed: string;
  active: boolean;
  onApply: () => void;
}

function PresetCard({ preset, seed, active, onApply }: PresetCardProps) {
  const previewOptions: AvatarOptions = { seed, ...preset.options };
  return (
    <button
      type="button"
      onClick={onApply}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-2xl border bg-card p-3 text-center transition-all hover:bg-card-active",
        active
          ? "border-acid ring-2 ring-acid/30"
          : "border-separator hover:border-acid/40",
      )}
    >
      <div className="overflow-hidden rounded-xl transition-transform group-hover:scale-105">
        <UserAvatar options={previewOptions} size={96} />
      </div>
      <p className="mt-1 text-[12px] font-semibold text-foreground">{preset.name}</p>
      <p className="text-[10.5px] leading-snug text-muted/70 line-clamp-2">{preset.description}</p>
      {active && (
        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-acid/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-acid">
          Active
        </span>
      )}
    </button>
  );
}

function findActivePreset(draft: AvatarOptions): string | null {
  type PresetKey = keyof Omit<AvatarOptions, "seed">;
  for (const p of AVATAR_PRESETS) {
    const keys = Object.keys(p.options) as PresetKey[];
    let match = true;
    for (const k of keys) {
      if (p.options[k] !== draft[k]) {
        match = false;
        break;
      }
    }
    if (match) return p.id;
  }
  return null;
}

// ── Trait tile picker ─────────────────────────────────────────────────────

interface TraitTilePickerProps {
  label: string;
  helper?: string;
  draft: AvatarOptions;
  traitKey: keyof AvatarOptions;
  options: string[];
  nullable: boolean;
  onChange: (value: string | undefined) => void;
}

function TraitTilePicker({
  label,
  helper,
  draft,
  traitKey,
  options,
  nullable,
  onChange,
}: TraitTilePickerProps) {
  const value = draft[traitKey];
  return (
    <div>
      <SectionLabel label={label} hint={helper} />
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8">
        {nullable && (
          <NoneTile active={value === undefined} onClick={() => onChange(undefined)} />
        )}
        {options.map((v) => {
          const isActive = v === value;
          const tileOptions: AvatarOptions = { ...draft, [traitKey]: v };
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5",
                isActive
                  ? "border-acid ring-2 ring-acid/30"
                  : "border-separator hover:border-acid/40",
              )}
              title={v}
            >
              <UserAvatar options={tileOptions} size={64} className="!rounded-none" />
              {isActive && (
                <span className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-acid text-background">
                  <ImageIcon className="h-2.5 w-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface NoneTileProps {
  active: boolean;
  onClick: () => void;
}

function NoneTile({ active, onClick }: NoneTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex aspect-square items-center justify-center rounded-xl border bg-input text-muted transition-all hover:-translate-y-0.5",
        active
          ? "border-acid bg-acid/10 text-acid ring-2 ring-acid/30"
          : "border-separator hover:border-acid/40 hover:text-foreground",
      )}
      title="None"
    >
      <div className="flex flex-col items-center gap-1">
        <Ban className="h-5 w-5" />
        <span className="text-[9px] font-semibold uppercase tracking-widest">None</span>
      </div>
    </button>
  );
}

// ── Small primitives ──────────────────────────────────────────────────────

function SectionLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted/60">
        {label}
      </p>
      {hint && <p className="text-[11px] text-muted/55">{hint}</p>}
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-1.5 text-[12px] font-semibold transition-colors",
        active ? "bg-acid text-background" : "text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

interface SwatchGridProps {
  value: string;
  onChange: (color: string) => void;
}

function SwatchGrid({ value, onChange }: SwatchGridProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {BACKGROUND_COLORS.map((color) => {
        const active = color === value;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Color ${color}`}
            className={cn(
              "h-9 w-9 rounded-full border-2 transition-all hover:scale-110",
              active
                ? "border-acid ring-2 ring-acid/30 scale-110"
                : "border-separator",
            )}
            style={{ backgroundColor: `#${color}` }}
          />
        );
      })}
    </div>
  );
}

