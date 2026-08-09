import { DAY_MS, HOUR_MS, NOW } from "@/lib/constants";
import type { ExceptionReason, ServiceLevel, ShipmentStatus, TransportMode } from "@/lib/types";
import { EXCEPTION_REASONS, MODE_LABELS, SERVICE_LABELS } from "@/lib/seed/reference";

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  label_created: "Label created",
  picked_up: "Picked up",
  in_transit: "In transit",
  at_hub: "At hub",
  customs_hold: "Customs hold",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  delayed: "Delayed",
  failed_delivery: "Failed delivery",
  cancelled: "Cancelled",
};

export function statusLabel(status: ShipmentStatus): string {
  return STATUS_LABELS[status];
}

export function serviceLabel(level: ServiceLevel): string {
  return SERVICE_LABELS[level];
}

export function modeLabel(mode: TransportMode): string {
  return MODE_LABELS[mode];
}

export function exceptionLabel(reason: ExceptionReason): string {
  return EXCEPTION_REASONS[reason].label;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

export function formatKg(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })} kg`;
}

export function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}%`;
}

export function formatDate(ts: number, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  }).format(new Date(ts));
}

export function formatDateTime(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function formatTime(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function formatRelative(ts: number, now = NOW): string {
  const delta = ts - now;
  const abs = Math.abs(delta);
  const suffix = delta >= 0 ? "from now" : "ago";
  if (abs < HOUR_MS) {
    const mins = Math.max(1, Math.round(abs / 60000));
    return `${mins}m ${suffix}`;
  }
  if (abs < DAY_MS) {
    const hours = Math.round(abs / HOUR_MS);
    return `${hours}h ${suffix}`;
  }
  const days = Math.round(abs / DAY_MS);
  return `${days}d ${suffix}`;
}

/** Plain-language ETA for customer-facing copy. */
export function formatEta(ts: number, now = NOW): string {
  const day = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(ts));
  const time = formatTime(ts);
  if (ts < now) return `Was due ${formatDateTime(ts)}`;
  const daysAhead = Math.floor((ts - now) / DAY_MS);
  if (daysAhead === 0) return `Arriving today by ${time}`;
  if (daysAhead === 1) return `Arriving tomorrow by ${time}`;
  return `Arriving ${day} by ${time}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
