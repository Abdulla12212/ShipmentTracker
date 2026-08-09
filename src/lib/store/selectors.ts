import { DAY_MS, NOW } from "@/lib/constants";
import { hubById } from "@/lib/seed/geo";
import { isActiveStatus, isExceptionStatus } from "@/lib/status";
import type { Dataset, Region, ServiceLevel, Shipment, ShipmentStatus } from "@/lib/types";

export interface ShipmentFilters {
  query?: string;
  statuses?: ShipmentStatus[];
  carrierId?: string;
  serviceLevel?: ServiceLevel;
  originRegion?: Region;
  destinationRegion?: Region;
  exceptionOnly?: boolean;
  from?: number;
  to?: number;
}

export type SavedView = "all" | "at_risk" | "out_for_delivery" | "delivered_today";

export function getShipment(dataset: Dataset, id: string): Shipment | undefined {
  return dataset.shipments.find((s) => s.id === id);
}

export function getByTracking(dataset: Dataset, trackingNumber: string): Shipment | undefined {
  const q = trackingNumber.trim().toUpperCase();
  return dataset.shipments.find((s) => s.trackingNumber.toUpperCase() === q);
}

export function carrierName(dataset: Dataset, carrierId: string): string {
  return dataset.carriers.find((c) => c.id === carrierId)?.name ?? "Unknown";
}

export function customerName(dataset: Dataset, customerId: string): string {
  return dataset.customers.find((c) => c.id === customerId)?.name ?? "Unknown";
}

export function filterShipments(dataset: Dataset, filters: ShipmentFilters): Shipment[] {
  const q = filters.query?.trim().toLowerCase();
  return dataset.shipments.filter((s) => {
    if (filters.statuses?.length && !filters.statuses.includes(s.status)) return false;
    if (filters.carrierId && s.carrierId !== filters.carrierId) return false;
    if (filters.serviceLevel && s.serviceLevel !== filters.serviceLevel) return false;
    if (filters.exceptionOnly && !(s.exception && !s.exception.resolvedAt)) return false;
    if (filters.from && s.createdAt < filters.from) return false;
    if (filters.to && s.createdAt > filters.to) return false;
    if (filters.originRegion && hubById(s.originHubId).region !== filters.originRegion) return false;
    if (
      filters.destinationRegion &&
      hubById(s.destinationHubId).region !== filters.destinationRegion
    ) {
      return false;
    }
    if (q) {
      const customer = customerName(dataset, s.customerId).toLowerCase();
      const origin = hubById(s.originHubId);
      const dest = hubById(s.destinationHubId);
      const hay = [
        s.trackingNumber,
        s.reference,
        customer,
        origin.city,
        dest.city,
        s.recipient.name,
        s.sender.name,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function applySavedView(
  dataset: Dataset,
  view: SavedView,
  now = NOW,
): Shipment[] {
  switch (view) {
    case "at_risk":
      return dataset.shipments.filter(
        (s) =>
          (s.exception && !s.exception.resolvedAt) ||
          isExceptionStatus(s.status) ||
          (isActiveStatus(s.status) && s.estimatedDelivery < now),
      );
    case "out_for_delivery":
      return dataset.shipments.filter((s) => s.status === "out_for_delivery");
    case "delivered_today":
      return dataset.shipments.filter(
        (s) =>
          s.status === "delivered" &&
          !!s.actualDelivery &&
          s.actualDelivery >= now - DAY_MS,
      );
    default:
      return dataset.shipments;
  }
}

export interface Kpis {
  active: number;
  onTimeRate: number;
  exceptionsOpen: number;
  avgTransitDays: number;
  deliveriesToday: number;
  activeSpark: number[];
  onTimeSpark: number[];
  exceptionSpark: number[];
  transitSpark: number[];
  deliverySpark: number[];
}

function dayBuckets(now: number, days: number): number[] {
  return Array.from({ length: days }, (_, i) => now - (days - 1 - i) * DAY_MS);
}

export function computeKpis(dataset: Dataset, now = NOW): Kpis {
  const active = dataset.shipments.filter((s) => isActiveStatus(s.status)).length;
  const delivered = dataset.shipments.filter((s) => s.status === "delivered" && s.actualDelivery);
  const onTime = delivered.filter(
    (s) => (s.actualDelivery ?? 0) <= s.promisedDelivery + DAY_MS * 0.25,
  );
  const onTimeRate = delivered.length ? onTime.length / delivered.length : 1;
  const exceptionsOpen = dataset.shipments.filter(
    (s) => s.exception && !s.exception.resolvedAt,
  ).length;
  const transitSamples = delivered.map(
    (s) => ((s.actualDelivery ?? s.estimatedDelivery) - (s.pickedUpAt ?? s.createdAt)) / DAY_MS,
  );
  const avgTransitDays = transitSamples.length
    ? transitSamples.reduce((a, b) => a + b, 0) / transitSamples.length
    : 0;
  const deliveriesToday = delivered.filter(
    (s) => (s.actualDelivery ?? 0) >= now - DAY_MS,
  ).length;

  const buckets = dayBuckets(now, 7);
  const activeSpark = buckets.map((start) => {
    const end = start + DAY_MS;
    return dataset.shipments.filter(
      (s) => s.createdAt <= end && (s.actualDelivery ?? now + DAY_MS) >= start,
    ).length;
  });
  const onTimeSpark = buckets.map((start) => {
    const end = start + DAY_MS;
    const dayDelivered = delivered.filter(
      (s) => (s.actualDelivery ?? 0) >= start && (s.actualDelivery ?? 0) < end,
    );
    if (!dayDelivered.length) return onTimeRate;
    return (
      dayDelivered.filter((s) => (s.actualDelivery ?? 0) <= s.promisedDelivery + DAY_MS * 0.25)
        .length / dayDelivered.length
    );
  });
  const exceptionSpark = buckets.map((start) => {
    const end = start + DAY_MS;
    return dataset.shipments.filter(
      (s) => s.exception && s.exception.openedAt >= start && s.exception.openedAt < end,
    ).length;
  });
  const transitSpark = buckets.map((start, i) => avgTransitDays * (0.9 + ((i % 3) * 0.05)));
  const deliverySpark = buckets.map((start) => {
    const end = start + DAY_MS;
    return delivered.filter(
      (s) => (s.actualDelivery ?? 0) >= start && (s.actualDelivery ?? 0) < end,
    ).length;
  });

  return {
    active,
    onTimeRate,
    exceptionsOpen,
    avgTransitDays,
    deliveriesToday,
    activeSpark,
    onTimeSpark,
    exceptionSpark,
    transitSpark,
    deliverySpark,
  };
}

export function statusCounts(dataset: Dataset): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of dataset.shipments) {
    counts[s.status] = (counts[s.status] ?? 0) + 1;
  }
  return counts;
}

export function openExceptions(dataset: Dataset): Shipment[] {
  return dataset.shipments
    .filter((s) => s.exception && !s.exception.resolvedAt)
    .sort((a, b) => {
      const sev = { high: 0, medium: 1, low: 2 };
      const as = sev[a.exception!.severity];
      const bs = sev[b.exception!.severity];
      if (as !== bs) return as - bs;
      return b.exception!.openedAt - a.exception!.openedAt;
    });
}

export interface AnalyticsBundle {
  onTimeTrend: Array<{ day: string; rate: number; volume: number }>;
  lanes: Array<{ lane: string; count: number }>;
  carriers: Array<{
    id: string;
    name: string;
    onTime: number;
    avgDelayHours: number;
    costPerKg: number;
    exceptionRate: number;
    volume: number;
  }>;
  deliveryHistogram: Array<{ bucket: string; count: number }>;
  exceptionBreakdown: Array<{ reason: string; count: number }>;
}

export function computeAnalytics(
  dataset: Dataset,
  from: number,
  to: number,
  now = NOW,
): AnalyticsBundle {
  const inRange = dataset.shipments.filter((s) => s.createdAt >= from && s.createdAt <= to);
  const days = Math.max(1, Math.ceil((to - from) / DAY_MS));
  const step = Math.max(1, Math.floor(days / 12));
  const onTimeTrend: AnalyticsBundle["onTimeTrend"] = [];
  for (let t = from; t <= to; t += step * DAY_MS) {
    const end = t + step * DAY_MS;
    const delivered = inRange.filter(
      (s) =>
        s.status === "delivered" &&
        (s.actualDelivery ?? 0) >= t &&
        (s.actualDelivery ?? 0) < end,
    );
    const onTime = delivered.filter(
      (s) => (s.actualDelivery ?? 0) <= s.promisedDelivery + DAY_MS * 0.25,
    );
    onTimeTrend.push({
      day: new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      rate: delivered.length ? onTime.length / delivered.length : 0,
      volume: delivered.length,
    });
  }

  const laneMap = new Map<string, number>();
  for (const s of inRange) {
    const lane = `${hubById(s.originHubId).code} → ${hubById(s.destinationHubId).code}`;
    laneMap.set(lane, (laneMap.get(lane) ?? 0) + 1);
  }
  const lanes = [...laneMap.entries()]
    .map(([lane, count]) => ({ lane, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const carriers = dataset.carriers.map((carrier) => {
    const list = inRange.filter((s) => s.carrierId === carrier.id);
    const delivered = list.filter((s) => s.status === "delivered" && s.actualDelivery);
    const onTime = delivered.filter(
      (s) => (s.actualDelivery ?? 0) <= s.promisedDelivery + DAY_MS * 0.25,
    );
    const delays = delivered.map(
      (s) => Math.max(0, (s.actualDelivery ?? 0) - s.promisedDelivery) / (60 * 60 * 1000),
    );
    const exceptions = list.filter((s) => s.exception).length;
    const kg = list.reduce((sum, s) => sum + s.weightKg, 0) || 1;
    const cost = list.reduce((sum, s) => sum + s.costUsd, 0);
    return {
      id: carrier.id,
      name: carrier.name,
      onTime: delivered.length ? onTime.length / delivered.length : carrier.reliability,
      avgDelayHours: delays.length ? delays.reduce((a, b) => a + b, 0) / delays.length : 0,
      costPerKg: cost / kg,
      exceptionRate: list.length ? exceptions / list.length : 0,
      volume: list.length,
    };
  });

  const histBuckets = ["0–1d", "1–2d", "2–4d", "4–7d", "7d+"];
  const histCounts = [0, 0, 0, 0, 0];
  for (const s of inRange.filter((x) => x.status === "delivered" && x.actualDelivery)) {
    const daysTaken =
      ((s.actualDelivery ?? now) - (s.pickedUpAt ?? s.createdAt)) / DAY_MS;
    if (daysTaken < 1) histCounts[0] += 1;
    else if (daysTaken < 2) histCounts[1] += 1;
    else if (daysTaken < 4) histCounts[2] += 1;
    else if (daysTaken < 7) histCounts[3] += 1;
    else histCounts[4] += 1;
  }
  const deliveryHistogram = histBuckets.map((bucket, i) => ({
    bucket,
    count: histCounts[i],
  }));

  const reasonMap = new Map<string, number>();
  for (const s of inRange) {
    if (!s.exception) continue;
    reasonMap.set(s.exception.reason, (reasonMap.get(s.exception.reason) ?? 0) + 1);
  }
  const exceptionBreakdown = [...reasonMap.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return { onTimeTrend, lanes, carriers, deliveryHistogram, exceptionBreakdown };
}

export function sampleTrackingNumbers(dataset: Dataset, count = 4): string[] {
  const preferred = ["SHP-2401881", "SHP-2407742", "SHP-2405510", "SHP-2409033"];
  const found = preferred.filter((tn) => dataset.shipments.some((s) => s.trackingNumber === tn));
  if (found.length >= count) return found.slice(0, count);
  return dataset.shipments.slice(0, count).map((s) => s.trackingNumber);
}
