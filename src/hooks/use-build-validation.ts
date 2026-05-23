import { useCallback, useState } from "react";
import type {
  Achievement,
  App,
  BuildValidation,
} from "@/lib/types";
import { validateBuildClient } from "@/lib/api/build-validation";

interface RunArgs {
  file: Blob | File;
  app: Pick<App, "id">;
  achievements: Pick<Achievement, "id">[];
  localPath?: string;
}

export function useValidateBuildClient() {
  const [report, setReport] = useState<BuildValidation | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (args: RunArgs) => {
    setIsRunning(true);
    setError(null);
    try {
      const result = await validateBuildClient(args);
      setReport(result);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Validation failed.";
      setError(msg);
      setReport(null);
      return null;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setReport(null);
    setError(null);
  }, []);

  return { report, isRunning, error, run, reset };
}
