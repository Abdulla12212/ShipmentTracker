export const SHIPMENT_STATUSES = [
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
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const EXCEPTION_STATUSES: ShipmentStatus[] = [
  "customs_hold",
  "delayed",
  "failed_delivery",
];

export const CLOSED_STATUSES: ShipmentStatus[] = ["delivered", "cancelled"];

export type ServiceLevel =
  | "economy"
  | "standard"
  | "express"
  | "priority_overnight";

export type TransportMode = "air" | "ocean" | "road" | "rail";

export type Severity = "low" | "medium" | "high";

export type ExceptionReason =
  | "customs_documentation"
  | "weather_delay"
  | "mechanical_failure"
  | "address_unverified"
  | "recipient_unavailable"
  | "capacity_shortfall"
  | "damaged_packaging";

export interface Hub {
  id: string;
  code: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  region: Region;
  capacity: number;
}

export type Region =
  | "North America"
  | "South America"
  | "Europe"
  | "Middle East"
  | "Africa"
  | "Asia Pacific";

export interface Carrier {
  id: string;
  name: string;
  code: string;
  modes: TransportMode[];
  reliability: number;
  costIndex: number;
}

export interface Customer {
  id: string;
  name: string;
  industry: string;
  tier: "Enterprise" | "Growth" | "Standard";
  contact: string;
  email: string;
}

export interface Driver {
  id: string;
  name: string;
  carrierId: string;
  phone: string;
  rating: number;
}

export interface Vehicle {
  id: string;
  label: string;
  type: "Van" | "Box Truck" | "Semi-Trailer" | "Freighter" | "Container Ship";
  carrierId: string;
  capacityKg: number;
}

export interface Party {
  name: string;
  company: string;
  addressLine: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
}

export interface LineItem {
  id: string;
  description: string;
  sku: string;
  quantity: number;
  weightKg: number;
  valueUsd: number;
  hsCode: string;
}

export interface TrackingEvent {
  id: string;
  at: number;
  status: ShipmentStatus;
  hubId?: string;
  location: string;
  description: string;
  kind: "milestone" | "scan" | "exception" | "note";
}

export interface ShipmentDocument {
  id: string;
  name: string;
  type: "Bill of Lading" | "Commercial Invoice" | "Customs Form" | "Packing List";
  sizeKb: number;
  issuedAt: number;
}

export interface Note {
  id: string;
  author: string;
  at: number;
  body: string;
}

export interface ShipmentException {
  reason: ExceptionReason;
  severity: Severity;
  detail: string;
  openedAt: number;
  resolvedAt?: number;
}

export interface TemperatureReading {
  at: number;
  celsius: number;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  reference: string;
  status: ShipmentStatus;
  serviceLevel: ServiceLevel;
  mode: TransportMode;
  carrierId: string;
  vehicleId: string;
  driverId: string;
  customerId: string;
  originHubId: string;
  destinationHubId: string;
  sender: Party;
  recipient: Party;
  createdAt: number;
  pickedUpAt?: number;
  estimatedDelivery: number;
  promisedDelivery: number;
  actualDelivery?: number;
  progress: number;
  events: TrackingEvent[];
  items: LineItem[];
  weightKg: number;
  volumeM3: number;
  declaredValueUsd: number;
  costUsd: number;
  signatureRequired: boolean;
  deliveryInstructions?: string;
  temperatureControlled: boolean;
  temperatureReadings: TemperatureReading[];
  documents: ShipmentDocument[];
  notes: Note[];
  exception?: ShipmentException;
  podSignature?: string;
  receivedBy?: string;
}

export interface Dataset {
  hubs: Hub[];
  carriers: Carrier[];
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  shipments: Shipment[];
  generatedAt: number;
}
