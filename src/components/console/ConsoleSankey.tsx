import { useMemo } from "react";
import type { PathSankey } from "@/lib/types";

interface Props {
  data: PathSankey;
}

interface NodeLayout {
  id: string;
  label: string;
  x: number;
  y: number;
  depth: number;
}

interface LinkLayout {
  source: NodeLayout;
  target: NodeLayout;
  value: number;
  pct: number;
}

/**
 * Minimal SVG-based Sankey-ish diagram. Lays out nodes by depth (prefix in
 * `0::route` ids) and draws cubic bezier links sized by value. No third-party
 * library — keeps the bundle lean.
 */
export function ConsoleSankey({ data }: Props) {
  const layout = useMemo(() => {
    const W = 720;
    const H = 360;
    const padding = 24;
    const byDepth = new Map<number, string[]>();
    for (const n of data.nodes) {
      const m = /^(\d+)::(.+)$/.exec(n.id);
      const depth = m ? Number(m[1]) : 0;
      const arr = byDepth.get(depth) ?? [];
      arr.push(n.id);
      byDepth.set(depth, arr);
    }
    const depths = Array.from(byDepth.keys()).sort((a, b) => a - b);
    const nodeMap = new Map<string, NodeLayout>();
    for (const d of depths) {
      const ids = byDepth.get(d)!;
      const x = padding + (d / Math.max(1, depths.length - 1)) * (W - 2 * padding);
      ids.forEach((id, i) => {
        const y =
          padding + ((i + 1) / (ids.length + 1)) * (H - 2 * padding);
        const m = /^(\d+)::(.+)$/.exec(id);
        nodeMap.set(id, { id, label: m ? m[2] : id, x, y, depth: d });
      });
    }
    const maxValue = Math.max(1, ...data.links.map((l) => l.value));
    const links: LinkLayout[] = data.links
      .map((l) => {
        const source = nodeMap.get(l.source);
        const target = nodeMap.get(l.target);
        if (!source || !target) return null;
        return {
          source,
          target,
          value: l.value,
          pct: l.value / maxValue,
        };
      })
      .filter((x): x is LinkLayout => x !== null);
    return { width: W, height: H, nodes: Array.from(nodeMap.values()), links };
  }, [data]);

  if (data.nodes.length <= 1) {
    return (
      <p className="py-6 text-center text-[12px] text-muted/45">
        Not enough path data yet.
      </p>
    );
  }

  return (
    <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="w-full h-auto">
      {layout.links.map((l, i) => {
        const midX = (l.source.x + l.target.x) / 2;
        const strokeW = Math.max(1, l.pct * 12);
        return (
          <path
            key={i}
            d={`M ${l.source.x} ${l.source.y} C ${midX} ${l.source.y}, ${midX} ${l.target.y}, ${l.target.x} ${l.target.y}`}
            fill="none"
            stroke="var(--acid)"
            strokeOpacity={0.18 + l.pct * 0.5}
            strokeWidth={strokeW}
          />
        );
      })}
      {layout.nodes.map((n) => (
        <g key={n.id}>
          <rect
            x={n.x - 5}
            y={n.y - 8}
            width={10}
            height={16}
            rx={2}
            fill="var(--foreground)"
            opacity={0.7}
          />
          <text
            x={n.x + 9}
            y={n.y + 3}
            fontSize={9}
            fill="var(--muted)"
            opacity={0.85}
          >
            {n.label.length > 22 ? `${n.label.slice(0, 22)}…` : n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
