import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import type { FacetAverages } from "@/lib/types";
import { ChartContainer } from "@/components/ui/chart-container";

interface FacetRadarProps {
  averages: FacetAverages;
}

export function FacetRadar({ averages }: FacetRadarProps) {
  const data = [
    { facet: "Gameplay", value: averages.gameplay },
    { facet: "Story", value: averages.story },
    { facet: "Polish", value: averages.polish },
    { facet: "Value", value: averages.value },
    { facet: "Accessibility", value: averages.accessibility },
  ];

  return (
    <ChartContainer height={260}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--separator)" />
        <PolarAngleAxis
          dataKey="facet"
          tick={{ fill: "var(--text-muted, #9ca3af)", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 10]}
          tick={{ fill: "var(--text-muted, #9ca3af)", fontSize: 10 }}
          axisLine={false}
          tickCount={6}
          stroke="var(--separator)"
        />
        <Radar
          name="Facets"
          dataKey="value"
          stroke="var(--steam-accent)"
          strokeWidth={2}
          fill="var(--steam-accent)"
          fillOpacity={0.25}
          isAnimationActive={false}
        />
      </RadarChart>
    </ChartContainer>
  );
}
