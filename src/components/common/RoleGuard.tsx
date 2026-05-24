import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/lib/routes";
import type { UserRole } from "@/lib/types";
import { hasPermission, type PermissionKey } from "@/lib/permissions";

interface RoleGuardProps {
  /** Allowed roles. `admin` (top role) is always allowed implicitly. */
  roles?: UserRole[];
  /** Optional permission key — must ALSO pass when supplied. */
  permission?: PermissionKey | PermissionKey[];
  /** Override the redirect target when access is denied (default: /store). */
  fallbackPath?: string;
  children: ReactNode;
}

/**
 * Route-level gate. Supports both role-based and permission-key-based
 * checks. `admin` (the top role) is implicitly accepted for any role check.
 */
export function RoleGuard({ roles, permission, fallbackPath, children }: RoleGuardProps) {
  const authState = useAuthStore((s) => s.authState);
  const profile = useAuthStore((s) => s.profile);

  if (authState.type !== "Authenticated") {
    return <Navigate to={ROUTES.login} replace />;
  }
  if (!profile?.role) {
    return <Navigate to={fallbackPath ?? ROUTES.store} replace />;
  }

  // Role check — admin is the top role and is implicitly allowed everywhere.
  if (roles && roles.length > 0 && profile.role !== "admin") {
    if (!roles.includes(profile.role)) {
      return <Navigate to={fallbackPath ?? ROUTES.store} replace />;
    }
  }

  // Permission check (when supplied — admins with "*" always pass via hasPermission).
  if (permission) {
    const keys = Array.isArray(permission) ? permission : [permission];
    const ok = keys.some((k) => hasPermission(profile, k));
    if (!ok) {
      return <Navigate to={fallbackPath ?? ROUTES.store} replace />;
    }
  }

  return <>{children}</>;
}
