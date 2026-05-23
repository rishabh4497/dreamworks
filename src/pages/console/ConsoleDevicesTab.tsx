import { Cpu, HardDrive, Laptop, Monitor, MonitorSmartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleDonut } from "@/components/console/ConsoleDonut";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleTable } from "@/components/console/ConsoleTable";
import { useConsoleDevices, useConsoleRange } from "@/hooks/use-console";

export function ConsoleDevicesTab() {
  const [range] = useConsoleRange();
  const { data, isLoading, error } = useConsoleDevices(range);

  if (isLoading) return <LoadingSpinner label="Inspecting rigs…" />;
  if (error) {
    return (
      <Card className="p-4 text-[13px] text-red">
        Failed to load device breakdown: {(error as Error).message}
      </Card>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConsoleKpiTile
          icon={Laptop}
          label="% desktop"
          value={`${data.desktopPct}%`}
          tone="positive"
        />
        <ConsoleKpiTile
          icon={MonitorSmartphone}
          label="% web"
          value={`${data.webPct}%`}
        />
        <ConsoleKpiTile icon={Monitor} label="Top OS" value={data.topOs} />
        <ConsoleKpiTile
          icon={Cpu}
          label="Modal cores"
          value={data.modalCpuCores}
          hint="most common CPU class"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ConsoleSection title="OS distribution" className="lg:col-span-1">
          <Card className="p-4">
            <ConsoleDonut data={data.osBreakdown} />
          </Card>
        </ConsoleSection>
        <ConsoleSection title="CPU cores" className="lg:col-span-1">
          <Card className="p-4">
            <ConsoleHorizontalBar
              data={data.cpuCoreHistogram}
              colorVar="--cyan"
              limit={6}
            />
          </Card>
        </ConsoleSection>
        <ConsoleSection title="System memory" className="lg:col-span-1">
          <Card className="p-4">
            <ConsoleHorizontalBar
              data={data.memoryHistogram}
              colorVar="--green"
              limit={6}
            />
          </Card>
        </ConsoleSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsoleSection title="GPU top 10">
          <Card className="p-4">
            <ConsoleHorizontalBar
              data={data.gpuTop10}
              colorVar="--brand-plus"
              limit={10}
              emptyLabel="No GPU data — needs desktop sessions."
            />
          </Card>
        </ConsoleSection>
        <ConsoleSection title="Screen resolution">
          <Card className="p-4">
            <ConsoleHorizontalBar
              data={data.resolutionBreakdown}
              colorVar="--orange"
              limit={8}
            />
          </Card>
        </ConsoleSection>
      </div>

      <ConsoleSection title="Error rate by OS" description="Errors per 1,000 sessions">
        <Card className="p-4">
          <ConsoleTable
            columns={[
              { key: "os", label: "OS", render: (r) => r.os },
              {
                key: "sessions",
                label: "Sessions",
                align: "right",
                render: (r) => r.sessions.toLocaleString(),
              },
              {
                key: "errors",
                label: "Errors",
                align: "right",
                render: (r) => r.errors.toLocaleString(),
              },
              {
                key: "rate",
                label: "per 1k",
                align: "right",
                render: (r) => (
                  <span className={r.ratePer1k > 50 ? "text-red" : ""}>
                    {r.ratePer1k}
                  </span>
                ),
              },
            ]}
            rows={data.osErrorRate}
            getRowKey={(r) => r.os}
          />
        </Card>
      </ConsoleSection>

      <ConsoleSection title="Users with the most errors" description="And the hardware they're on">
        <Card className="p-4">
          <ConsoleTable
            columns={[
              {
                key: "uid",
                label: "User",
                render: (r) => (
                  <span className="font-mono text-foreground/80">{r.uid.slice(0, 12)}</span>
                ),
              },
              {
                key: "errors",
                label: "Errors",
                align: "right",
                render: (r) => r.errors.toLocaleString(),
              },
              {
                key: "os",
                label: "OS",
                render: (r) => r.device.os,
              },
              {
                key: "cores",
                label: "Cores",
                align: "right",
                render: (r) => r.device.cpuCores,
              },
              {
                key: "ram",
                label: "RAM",
                align: "right",
                render: (r) => (
                  <span className="inline-flex items-center gap-1">
                    <HardDrive className="h-3 w-3 text-muted/55" />
                    {r.device.deviceMemoryGb > 0
                      ? `${r.device.deviceMemoryGb} GB`
                      : "—"}
                  </span>
                ),
              },
            ]}
            rows={data.highErrorUsers}
            getRowKey={(r) => r.uid}
            emptyLabel="No error-prone users in this range."
          />
        </Card>
      </ConsoleSection>
    </div>
  );
}
