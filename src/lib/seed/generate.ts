import { DAY_MS, HOUR_MS, NOW, SEED } from "@/lib/constants";
import { HUBS, haversineKm, hubById } from "@/lib/seed/geo";
import { createRandom, type Random } from "@/lib/seed/prng";
import {
  CARRIERS,
  CUSTOMER_NAMES,
  EXCEPTION_REASONS,
  FIRST_NAMES,
  ITEM_DESCRIPTIONS,
  LAST_NAMES,
  OPS_AUTHORS,
  SERVICE_LEVELS,
  STREETS,
} from "@/lib/seed/reference";
import { progressForStatus } from "@/lib/status";
import type {
  Customer,
  Dataset,
  Driver,
  ExceptionReason,
  LineItem,
  Party,
  ServiceLevel,
  Shipment,
  ShipmentDocument,
  ShipmentStatus,
  TemperatureReading,
  TrackingEvent,
  TransportMode,
  Vehicle,
} from "@/lib/types";

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

function makeParty(rng: Random, company: string, hubId: string): Party {
  const hub = hubById(hubId);
  const first = rng.pick(FIRST_NAMES);
  const last = rng.pick(LAST_NAMES);
  return {
    name: `${first} ${last}`,
    company,
    addressLine: `${rng.int(10, 980)} ${rng.pick(STREETS)}`,
    city: hub.city,
    country: hub.country,
    postalCode: `${rng.int(10000, 99999)}`,
    phone: `+${rng.int(1, 99)} ${rng.int(200, 999)} ${rng.int(100, 999)} ${rng.int(1000, 9999)}`,
    email: `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "") + "@example.com",
  };
}

function transitDays(mode: TransportMode, distanceKm: number, service: ServiceLevel): number {
  const base =
    mode === "air"
      ? Math.max(1, distanceKm / 6500)
      : mode === "ocean"
        ? Math.max(8, distanceKm / 700)
        : mode === "rail"
          ? Math.max(3, distanceKm / 900)
          : Math.max(1.2, distanceKm / 750);
  const serviceFactor =
    service === "priority_overnight"
      ? 0.45
      : service === "express"
        ? 0.65
        : service === "standard"
          ? 1
          : 1.35;
  return base * serviceFactor;
}

function makeItems(rng: Random, cold: boolean): LineItem[] {
  const count = rng.int(1, 4);
  const picks = rng.sample(ITEM_DESCRIPTIONS, count);
  return picks.map(([description, hsCode], i) => {
    const quantity = rng.int(1, 24);
    const unitWeight = rng.float(0.4, 48);
    const unitValue = rng.float(40, 4200);
    return {
      id: `item-${i}`,
      description: cold && i === 0 ? "Temperature-controlled cargo" : description,
      sku: `SKU-${rng.int(10000, 99999)}`,
      quantity,
      weightKg: Math.round(unitWeight * quantity * 10) / 10,
      valueUsd: Math.round(unitValue * quantity),
      hsCode,
    };
  });
}

function makeDocuments(rng: Random, createdAt: number, international: boolean): ShipmentDocument[] {
  const docs: ShipmentDocument[] = [
    {
      id: `doc-bol-${rng.int(1000, 9999)}`,
      name: "Bill of Lading",
      type: "Bill of Lading",
      sizeKb: rng.int(180, 640),
      issuedAt: createdAt + HOUR_MS,
    },
    {
      id: `doc-inv-${rng.int(1000, 9999)}`,
      name: "Commercial Invoice",
      type: "Commercial Invoice",
      sizeKb: rng.int(90, 320),
      issuedAt: createdAt + HOUR_MS * 2,
    },
    {
      id: `doc-pack-${rng.int(1000, 9999)}`,
      name: "Packing List",
      type: "Packing List",
      sizeKb: rng.int(60, 210),
      issuedAt: createdAt + HOUR_MS * 3,
    },
  ];
  if (international) {
    docs.push({
      id: `doc-cus-${rng.int(1000, 9999)}`,
      name: "Customs Form",
      type: "Customs Form",
      sizeKb: rng.int(120, 400),
      issuedAt: createdAt + HOUR_MS * 5,
    });
  }
  return docs;
}

function makeTemperatureReadings(
  rng: Random,
  start: number,
  end: number,
): TemperatureReading[] {
  const readings: TemperatureReading[] = [];
  const span = Math.max(HOUR_MS, end - start);
  const steps = rng.int(8, 18);
  for (let i = 0; i < steps; i += 1) {
    readings.push({
      at: start + (span * i) / (steps - 1),
      celsius: Math.round((2 + rng.float(-1.2, 1.8)) * 10) / 10,
    });
  }
  return readings;
}

function eventDesc(status: ShipmentStatus, location: string): string {
  switch (status) {
    case "label_created":
      return "Shipping label created and booking confirmed.";
    case "picked_up":
      return `Shipment collected from origin facility in ${location}.`;
    case "in_transit":
      return `Departed ${location} en route to next facility.`;
    case "at_hub":
      return `Arrived at sorting hub in ${location}.`;
    case "customs_hold":
      return `Held for customs review at ${location}.`;
    case "out_for_delivery":
      return `Out for delivery in ${location}.`;
    case "delivered":
      return `Delivered successfully in ${location}.`;
    case "delayed":
      return `Transit delay reported near ${location}.`;
    case "failed_delivery":
      return `Delivery attempt unsuccessful in ${location}.`;
    case "cancelled":
      return "Shipment cancelled prior to pickup.";
    default:
      return `Status update at ${location}.`;
  }
}

function buildEvents(
  rng: Random,
  status: ShipmentStatus,
  originId: string,
  destId: string,
  createdAt: number,
  estimatedDelivery: number,
  hasException: boolean,
  exceptionReason?: ExceptionReason,
): TrackingEvent[] {
  const origin = hubById(originId);
  const dest = hubById(destId);
  const mid = rng.pick(HUBS.filter((h) => h.id !== originId && h.id !== destId));
  const timeline: Array<{ status: ShipmentStatus; hubId?: string; location: string; kind: TrackingEvent["kind"] }> = [
    { status: "label_created", hubId: originId, location: `${origin.city}, ${origin.countryCode}`, kind: "milestone" },
  ];

  if (status === "cancelled") {
    timeline.push({
      status: "cancelled",
      hubId: originId,
      location: `${origin.city}, ${origin.countryCode}`,
      kind: "note",
    });
  } else {
    const chain: ShipmentStatus[] = ["picked_up", "in_transit", "at_hub", "in_transit", "out_for_delivery", "delivered"];
    const stopAt =
      status === "delayed" || status === "customs_hold" || status === "failed_delivery"
        ? status === "failed_delivery"
          ? "out_for_delivery"
          : "in_transit"
        : status;

    for (const step of chain) {
      const locationHub =
        step === "picked_up"
          ? origin
          : step === "out_for_delivery" || step === "delivered"
            ? dest
            : step === "at_hub"
              ? mid
              : rng.bool(0.5)
                ? mid
                : origin;
      timeline.push({
        status: step,
        hubId: locationHub.id,
        location: `${locationHub.city}, ${locationHub.countryCode}`,
        kind: step === "delivered" ? "milestone" : "scan",
      });
      if (step === stopAt) break;
    }

    if (hasException && exceptionReason) {
      const holdLocation = exceptionReason === "customs_documentation" ? dest : mid;
      timeline.push({
        status: status === "failed_delivery" ? "failed_delivery" : status === "customs_hold" ? "customs_hold" : "delayed",
        hubId: holdLocation.id,
        location: `${holdLocation.city}, ${holdLocation.countryCode}`,
        kind: "exception",
      });
    }
  }

  const end = Math.min(NOW, estimatedDelivery);
  return timeline.map((step, index) => {
    const t =
      timeline.length === 1
        ? createdAt
        : createdAt + ((end - createdAt) * index) / (timeline.length - 1);
    return {
      id: `evt-${index}`,
      at: Math.round(t),
      status: step.status,
      hubId: step.hubId,
      location: step.location,
      description: eventDesc(step.status, step.location),
      kind: step.kind,
    };
  });
}

function chooseStatus(rng: Random, createdAt: number, estimatedDelivery: number): ShipmentStatus {
  const age = NOW - createdAt;
  const total = Math.max(HOUR_MS, estimatedDelivery - createdAt);
  const ratio = age / total;

  if (rng.bool(0.03)) return "cancelled";
  if (ratio < 0.05) return "label_created";
  if (ratio < 0.15) return "picked_up";
  if (ratio >= 1.05) {
    return rng.weighted([
      ["delivered", 86],
      ["failed_delivery", 6],
      ["delayed", 5],
      ["customs_hold", 3],
    ]);
  }
  if (ratio > 0.85) {
    return rng.weighted([
      ["out_for_delivery", 55],
      ["at_hub", 20],
      ["delayed", 12],
      ["customs_hold", 8],
      ["in_transit", 5],
    ]);
  }
  return rng.weighted([
    ["in_transit", 52],
    ["at_hub", 22],
    ["delayed", 10],
    ["customs_hold", 6],
    ["picked_up", 10],
  ]);
}

export function generateDataset(seed = SEED): Dataset {
  const rng = createRandom(seed);

  const customers: Customer[] = CUSTOMER_NAMES.map(([name, industry], i) => {
    const first = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    return {
      id: `cus-${pad(i + 1, 3)}`,
      name,
      industry,
      tier: rng.weighted([
        ["Enterprise", 3],
        ["Growth", 4],
        ["Standard", 5],
      ]),
      contact: `${first} ${last}`,
      email: `logistics@${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
    };
  });

  const drivers: Driver[] = [];
  const vehicles: Vehicle[] = [];
  CARRIERS.forEach((carrier, ci) => {
    for (let d = 0; d < 3; d += 1) {
      drivers.push({
        id: `drv-${ci}-${d}`,
        name: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
        carrierId: carrier.id,
        phone: `+1 ${rng.int(200, 999)} ${rng.int(200, 999)} ${rng.int(1000, 9999)}`,
        rating: Math.round(rng.float(4.2, 5) * 10) / 10,
      });
    }
    const types: Vehicle["type"][] = carrier.modes.includes("ocean")
      ? ["Container Ship", "Semi-Trailer"]
      : carrier.modes.includes("air")
        ? ["Freighter", "Van", "Box Truck"]
        : ["Van", "Box Truck", "Semi-Trailer"];
    for (let v = 0; v < 3; v += 1) {
      const type = rng.pick(types);
      vehicles.push({
        id: `veh-${ci}-${v}`,
        label: `${carrier.code}-${pad(rng.int(100, 999), 3)}`,
        type,
        carrierId: carrier.id,
        capacityKg: type === "Container Ship" ? 280000 : type === "Freighter" ? 90000 : type === "Semi-Trailer" ? 22000 : type === "Box Truck" ? 4500 : 1200,
      });
    }
  });

  const shipments: Shipment[] = [];
  const count = 140;

  for (let i = 0; i < count; i += 1) {
    const origin = rng.pick(HUBS);
    let destination = rng.pick(HUBS);
    while (destination.id === origin.id) destination = rng.pick(HUBS);

    const distance = haversineKm(origin, destination);
    const international = origin.countryCode !== destination.countryCode;
    const carrier = rng.pick(
      CARRIERS.filter((c) => {
        if (distance > 5000) return c.modes.includes("air") || c.modes.includes("ocean");
        if (distance > 1500) return true;
        return c.modes.includes("road") || c.modes.includes("rail") || c.modes.includes("air");
      }),
    );
    const mode: TransportMode = rng.pick(carrier.modes);
    const service = rng.weighted(
      SERVICE_LEVELS.map((level) => [level, level === "standard" ? 4 : level === "express" ? 3 : 2] as const),
    );
    const days = transitDays(mode, distance, service);
    const createdAt = NOW - rng.float(0.2, 90) * DAY_MS;
    const promisedDelivery = createdAt + days * DAY_MS;
    const estimatedDelivery = promisedDelivery + rng.float(-0.4, 1.2) * DAY_MS;
    const status = chooseStatus(rng, createdAt, estimatedDelivery);
    const exceptionOpen =
      status === "delayed" || status === "customs_hold" || status === "failed_delivery";
    const exceptionReason: ExceptionReason | undefined = exceptionOpen
      ? status === "customs_hold"
        ? "customs_documentation"
        : status === "failed_delivery"
          ? rng.pick(["recipient_unavailable", "address_unverified"] as ExceptionReason[])
          : rng.pick(
              Object.keys(EXCEPTION_REASONS).filter(
                (r) => r !== "customs_documentation",
              ) as ExceptionReason[],
            )
      : undefined;

    const customer = rng.pick(customers);
    const carrierDrivers = drivers.filter((d) => d.carrierId === carrier.id);
    const carrierVehicles = vehicles.filter((v) => v.carrierId === carrier.id);
    const driver = rng.pick(carrierDrivers);
    const vehicle = rng.pick(carrierVehicles);
    const cold = rng.bool(0.18) || customer.industry === "Pharmaceutical" || customer.industry === "Healthcare";
    const items = makeItems(rng, cold).map((item, idx) => ({
      ...item,
      id: `shp-${pad(i + 1, 3)}-item-${idx}`,
    }));
    const weightKg = Math.round(items.reduce((s, it) => s + it.weightKg, 0) * 10) / 10;
    const declaredValueUsd = items.reduce((s, it) => s + it.valueUsd, 0);
    const events = buildEvents(
      rng,
      status,
      origin.id,
      destination.id,
      createdAt,
      estimatedDelivery,
      exceptionOpen,
      exceptionReason,
    ).map((evt, idx) => ({
      ...evt,
      id: `shp-${pad(i + 1, 3)}-evt-${idx}`,
    }));

    let progress = progressForStatus(status);
    if (status === "in_transit" || status === "at_hub" || status === "delayed") {
      progress = Math.min(0.92, Math.max(0.15, (NOW - createdAt) / (estimatedDelivery - createdAt)));
    }

    const delivered = status === "delivered";
    const actualDelivery = delivered
      ? Math.min(NOW, estimatedDelivery + rng.float(-0.6, 0.8) * DAY_MS)
      : undefined;

    const shipment: Shipment = {
      id: `shp-${pad(i + 1, 3)}`,
      trackingNumber: `SHP-${rng.int(1000000, 9999999)}`,
      reference: `PO-${rng.int(10000, 99999)}-${customer.name.slice(0, 3).toUpperCase()}`,
      status,
      serviceLevel: service,
      mode,
      carrierId: carrier.id,
      vehicleId: vehicle.id,
      driverId: driver.id,
      customerId: customer.id,
      originHubId: origin.id,
      destinationHubId: destination.id,
      sender: makeParty(rng, customer.name, origin.id),
      recipient: makeParty(rng, rng.bool(0.4) ? customer.name : `${rng.pick(FIRST_NAMES)} Receiving`, destination.id),
      createdAt: Math.round(createdAt),
      pickedUpAt: status === "label_created" || status === "cancelled" ? undefined : Math.round(createdAt + HOUR_MS * rng.float(2, 18)),
      estimatedDelivery: Math.round(estimatedDelivery),
      promisedDelivery: Math.round(promisedDelivery),
      actualDelivery: actualDelivery ? Math.round(actualDelivery) : undefined,
      progress: delivered ? 1 : Math.round(progress * 1000) / 1000,
      events,
      items,
      weightKg,
      volumeM3: Math.round(rng.float(0.05, 4.8) * 100) / 100,
      declaredValueUsd,
      costUsd: Math.round(carrier.costIndex * (20 + distance * 0.012 + weightKg * 0.45)),
      signatureRequired: rng.bool(0.55) || declaredValueUsd > 8000,
      deliveryInstructions: rng.bool(0.35)
        ? rng.pick([
            "Call recipient 30 minutes before arrival.",
            "Deliver to loading dock B; forklift available.",
            "Leave with front desk if no answer.",
            "Temperature-sensitive — do not leave unattended.",
          ])
        : undefined,
      temperatureControlled: cold,
      temperatureReadings: cold
        ? makeTemperatureReadings(rng, createdAt, delivered ? actualDelivery! : NOW)
        : [],
      documents: makeDocuments(rng, createdAt, international),
      notes: rng.bool(0.4)
        ? [
            {
              id: `note-${pad(i + 1, 3)}-0`,
              author: rng.pick(OPS_AUTHORS),
              at: Math.round(createdAt + DAY_MS * rng.float(0.2, 2)),
              body: rng.pick([
                "Customer requested proactive ETA updates.",
                "Verified commercial invoice against packing list.",
                "Priority handling approved for this account.",
                "Coordinated re-delivery window with consignee.",
              ]),
            },
          ]
        : [],
      exception: exceptionOpen && exceptionReason
        ? {
            reason: exceptionReason,
            severity: EXCEPTION_REASONS[exceptionReason].severity,
            detail: EXCEPTION_REASONS[exceptionReason].detail,
            openedAt: Math.round(events[events.length - 1]?.at ?? NOW - HOUR_MS * 6),
          }
        : undefined,
      podSignature: delivered ? `${rng.pick(FIRST_NAMES)[0]}. ${rng.pick(LAST_NAMES)}` : undefined,
      receivedBy: delivered ? `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}` : undefined,
    };

    // Ensure event ids on shipment use stable tracking prefix
    shipment.events = events;
    shipments.push(shipment);
  }

  // Guarantee a handful of friendly demo tracking numbers
  const showcase = [
    { idx: 0, trackingNumber: "SHP-2401881", status: "in_transit" as const },
    { idx: 1, trackingNumber: "SHP-2407742", status: "out_for_delivery" as const },
    { idx: 2, trackingNumber: "SHP-2405510", status: "delivered" as const },
    { idx: 3, trackingNumber: "SHP-2409033", status: "delayed" as const },
    { idx: 4, trackingNumber: "SHP-2406618", status: "customs_hold" as const },
  ];
  for (const item of showcase) {
    const s = shipments[item.idx];
    s.trackingNumber = item.trackingNumber;
    if (s.status !== item.status && item.status !== "delivered") {
      // leave generated status mostly intact; just pin numbers for demos
    }
  }

  return {
    hubs: HUBS,
    carriers: CARRIERS,
    customers,
    drivers,
    vehicles,
    shipments,
    generatedAt: NOW,
  };
}

export const INITIAL_DATASET = generateDataset();
