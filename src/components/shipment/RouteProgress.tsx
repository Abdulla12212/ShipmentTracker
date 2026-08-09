import { hubLabel } from "@/lib/seed/geo";
import { formatPercent } from "@/lib/format";

export function RouteProgress({
  originHubId,
  destinationHubId,
  progress,
}: {
  originHubId: string;
  destinationHubId: string;
  progress: number;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>{hubLabel(originHubId)}</span>
        <span className="tnum text-accent">{formatPercent(progress)}</span>
        <span>{hubLabel(destinationHubId)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-info to-accent transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
