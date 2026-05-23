import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { trackError } from "@/lib/telemetry";

interface State { hasError: boolean; error: Error | null; }
interface Props { children: ReactNode; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[Dreamworks ErrorBoundary]", error);
    trackError(error, {
      source: "boundary",
      context: { componentStack: info.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red/10">
            <AlertTriangle className="h-6 w-6 text-red" />
          </div>
          <div className="max-w-md text-center">
            <h1 className="text-[18px] font-semibold text-foreground">Something went wrong</h1>
            <p className="mt-1 text-[13px] text-muted/60">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-acid px-4 py-2 text-[13px] font-semibold text-background hover:brightness-110"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
