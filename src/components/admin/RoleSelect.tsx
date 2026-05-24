import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "user", label: "User" },
  { value: "developer", label: "Developer (employee)" },
  { value: "creator-developer", label: "Creator — Developer (studio)" },
  { value: "creator-publisher", label: "Creator — Publisher" },
  { value: "admin", label: "Admin (top)" },
];

interface RoleSelectProps {
  value: UserRole;
  onChange: (next: UserRole) => void;
  disabled?: boolean;
  className?: string;
}

export function RoleSelect({ value, onChange, disabled, className }: RoleSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as UserRole)}
      disabled={disabled}
      className={cn(
        "h-8 rounded-lg border border-separator bg-input px-2 text-[12px] text-foreground focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15 disabled:opacity-40",
        className,
      )}
    >
      {ROLES.map((role) => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  );
}
