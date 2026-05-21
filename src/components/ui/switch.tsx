import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}

export function Switch({ checked, onCheckedChange, disabled, id, ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer items-center rounded-full",
        "transition-colors duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-acid" : "bg-card-active",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm ring-1 ring-black/10",
          "transition-transform duration-200 ease-out will-change-transform",
          checked ? "translate-x-[19.5px]" : "translate-x-[1.5px]",
        )}
      />
    </button>
  );
}
