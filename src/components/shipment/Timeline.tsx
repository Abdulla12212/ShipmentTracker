import { formatDateTime } from "@/lib/format";
import { hubLabel } from "@/lib/seed/geo";
import { statusLabel } from "@/lib/format";
import { statusTone } from "@/lib/status";
import type { TrackingEvent } from "@/lib/types";
import { cx } from "@/lib/format";

const toneDot = {
  neutral: "bg-subtle",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  accent: "bg-accent",
} as const;

export function Timeline({
  events,
  currentStatus,
}: {
  events: TrackingEvent[];
  currentStatus?: string;
}) {
  const sorted = [...events].sort((a, b) => a.at - b.at);

  return (
    <ol className="relative space-y-0">
      {sorted.map((event, index) => {
        const tone = statusTone(event.status);
        const isLast = index === sorted.length - 1;
        const isCurrent = isLast && event.status === currentStatus;
        const location =
          event.location.includes(",") || !event.hubId
            ? event.location
            : hubLabel(event.hubId);

        return (
          <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span className="absolute top-3 left-[7px] h-[calc(100%-6px)] w-px bg-border" />
            ) : null}
            <span className="relative mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
              <span
                className={cx(
                  "h-2.5 w-2.5 rounded-full",
                  toneDot[tone],
                  isCurrent && "ring-4 ring-accent/20",
                )}
              />
              {isCurrent ? (
                <span className="absolute inset-0 animate-ping rounded-full bg-accent/40" />
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-fg">{statusLabel(event.status)}</p>
                <time className="tnum text-xs text-subtle">{formatDateTime(event.at)}</time>
              </div>
              <p className="mt-0.5 text-xs text-muted">{location}</p>
              <p className="mt-1 text-sm text-muted">{event.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
