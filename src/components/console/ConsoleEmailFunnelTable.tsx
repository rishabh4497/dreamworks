import type { EmailFunnelReport } from "@/lib/types";

interface Props {
  report: EmailFunnelReport;
}

export function ConsoleEmailFunnelTable({ report }: Props) {
  if (report.templates.length === 0) {
    return (
      <p className="py-6 text-center text-[12px] text-muted/55">No email events captured yet.</p>
    );
  }
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="text-[10.5px] uppercase tracking-widest text-muted/45">
          <th className="text-left font-normal pb-1.5">Template</th>
          <th className="text-right font-normal pb-1.5 pr-2">Sent</th>
          <th className="text-right font-normal pb-1.5 pr-2">Deliver%</th>
          <th className="text-right font-normal pb-1.5 pr-2">Open%</th>
          <th className="text-right font-normal pb-1.5 pr-2">Click%</th>
          <th className="text-right font-normal pb-1.5">Convert%</th>
        </tr>
      </thead>
      <tbody>
        {report.templates.map((t) => (
          <tr key={String(t.template)} className="border-t border-separator/50">
            <td className="py-1.5 text-foreground/85">{String(t.template)}</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-muted/75">{t.sent}</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-muted/75">{t.deliveryPct.toFixed(1)}%</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-foreground/85">{t.openPct.toFixed(1)}%</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-foreground/85">{t.clickPct.toFixed(1)}%</td>
            <td className="py-1.5 text-right tabular-nums text-green/85">{t.conversionPct.toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
