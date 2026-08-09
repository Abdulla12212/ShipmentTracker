import type { ShipmentStatus } from "@/lib/types";
import { CLOSED_STATUSES, EXCEPTION_STATUSES } from "@/lib/types";

export const STATUS_ORDER: ShipmentStatus[] = [
  "label_created",
  "picked_up",
  "in_transit",
  "at_hub",
  "customs_hold",
  "out_for_delivery",
  "delivered",
  "delayed",
  "failed_delivery",
  "cancelled",
];

const FLOW: ShipmentStatus[] = [
  "label_created",
  "picked_up",
  "in_transit",
  "at_hub",
  "out_for_delivery",
  "delivered",
];

export function isExceptionStatus(status: ShipmentStatus): boolean {
  return EXCEPTION_STATUSES.includes(status);
}

export function isClosedStatus(status: ShipmentStatus): boolean {
  return CLOSED_STATUSES.includes(status);
}

export function isActiveStatus(status: ShipmentStatus): boolean {
  return !isClosedStatus(status);
}

export function nextStatus(status: ShipmentStatus): ShipmentStatus | null {
  if (status === "customs_hold" || status === "delayed" || status === "failed_delivery") {
    return "in_transit";
  }
  const idx = FLOW.indexOf(status);
  if (idx < 0 || idx >= FLOW.length - 1) return null;
  return FLOW[idx + 1];
}

export function statusTone(
  status: ShipmentStatus,
): "neutral" | "info" | "success" | "warning" | "danger" | "accent" {
  switch (status) {
    case "delivered":
      return "success";
    case "out_for_delivery":
      return "accent";
    case "in_transit":
    case "at_hub":
    case "picked_up":
      return "info";
    case "label_created":
      return "neutral";
    case "delayed":
    case "customs_hold":
      return "warning";
    case "failed_delivery":
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

export function progressForStatus(status: ShipmentStatus): number {
  switch (status) {
    case "label_created":
      return 0.02;
    case "picked_up":
      return 0.12;
    case "in_transit":
      return 0.45;
    case "at_hub":
      return 0.62;
    case "customs_hold":
      return 0.55;
    case "out_for_delivery":
      return 0.88;
    case "delivered":
      return 1;
    case "delayed":
      return 0.4;
    case "failed_delivery":
      return 0.9;
    case "cancelled":
      return 0;
    default:
      return 0;
  }
}
