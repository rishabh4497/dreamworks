import type { ReactElement } from "react";
import { ResponsiveContainer } from "recharts";

interface ChartContainerProps {
  height?: number;
  children: ReactElement;
}

export function ChartContainer({ height = 220, children }: ChartContainerProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
