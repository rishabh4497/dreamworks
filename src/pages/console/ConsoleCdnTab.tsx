import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleCdnMap } from "@/components/console/ConsoleCdnMap";
import { useCdn } from "@/hooks/use-console-advanced";

export function ConsoleCdnTab() {
  const { data, isLoading } = useCdn();
  if (isLoading) return <LoadingSpinner label="Pulling edge metrics…" />;
  return (
    <ConsoleSection title="CDN edges" description="Per-region distribution performance + cache hit rates">
      <ConsoleCdnMap regions={data ?? []} />
    </ConsoleSection>
  );
}
