import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/lib/routes";
import type { UserRole } from "@/lib/types";

interface RoleGuardProps {
  roles: UserRole[];
  children: ReactNode;
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const authState = useAuthStore((s) => s.authState);
  const profile = useAuthStore((s) => s.profile);

  if (authState.type !== "Authenticated") {
    return <Navigate to={ROUTES.login} replace />;
  }
  if (!profile?.role || !roles.includes(profile.role)) {
    return <Navigate to={ROUTES.store} replace />;
  }
  return <>{children}</>;
}
