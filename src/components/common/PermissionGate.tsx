import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { hasPermission, type PermissionKey } from "@/lib/permissions";

interface Props {
  /** Single permission key, or an array — ANY match passes. */
  require: PermissionKey | PermissionKey[];
  children: ReactNode;
  /** Rendered when the user lacks the permission. Defaults to null. */
  fallback?: ReactNode;
}

/**
 * Render children only if the signed-in user has the required permission.
 * Treats owner as a superset of every key. Use for in-page widgets and
 * action buttons; for whole routes, use `RoleGuard`.
 */
export function PermissionGate({ require, children, fallback = null }: Props) {
  const profile = useAuthStore((s) => s.profile);
  const keys = Array.isArray(require) ? require : [require];
  const ok = keys.some((k) => hasPermission(profile, k));
  if (!ok) return <>{fallback}</>;
  return <>{children}</>;
}
