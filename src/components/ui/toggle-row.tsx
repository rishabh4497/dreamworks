import { Switch } from "./switch";

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({ label, description, checked, onCheckedChange, disabled }: ToggleRowProps) {
  const toggle = () => {
    if (disabled) return;
    onCheckedChange(!checked);
  };
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div
        className="min-w-0 flex-1 cursor-pointer select-none"
        onClick={toggle}
        role="presentation"
      >
        <p className="text-[13px] font-medium text-foreground/85">{label}</p>
        {description && (
          <p className="mt-0.5 text-[11px] text-muted/50 leading-snug">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} ariaLabel={label} />
    </div>
  );
}
