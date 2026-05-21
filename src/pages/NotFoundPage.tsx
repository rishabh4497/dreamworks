import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-[48px] font-bold text-foreground/30">404</p>
      <p className="text-[14px] text-muted/70">This page didn't make it into the build.</p>
      <Link to={ROUTES.store} className="text-[12px] text-acid hover:underline">
        Back to store
      </Link>
    </div>
  );
}
