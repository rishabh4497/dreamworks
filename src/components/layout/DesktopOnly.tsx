import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { usePlatform } from "@/hooks/use-platform";

export function DesktopOnly({ children }: { children: ReactNode }) {
  const { isDesktop } = usePlatform();
  if (!isDesktop) return <Navigate to={ROUTES.store} replace />;
  return <>{children}</>;
}
