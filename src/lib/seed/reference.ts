import type { Carrier, ExceptionReason, ServiceLevel, Severity, TransportMode } from "@/lib/types";

export const CARRIERS: Carrier[] = [
  { id: "car-northwind", name: "Northwind Freight", code: "NWF", modes: ["road", "air"], reliability: 0.94, costIndex: 1.08 },
  { id: "car-meridian", name: "Meridian Air Cargo", code: "MAC", modes: ["air"], reliability: 0.96, costIndex: 1.42 },
  { id: "car-bluepeak", name: "Blue Peak Logistics", code: "BPL", modes: ["road", "rail"], reliability: 0.9, costIndex: 0.86 },
  { id: "car-atlas", name: "Atlas Ocean Lines", code: "AOL", modes: ["ocean"], reliability: 0.88, costIndex: 0.54 },
  { id: "car-vertex", name: "Vertex Express", code: "VTX", modes: ["air", "road"], reliability: 0.97, costIndex: 1.55 },
  { id: "car-cascade", name: "Cascade Ground", code: "CSG", modes: ["road"], reliability: 0.91, costIndex: 0.79 },
  { id: "car-orion", name: "Orion Intermodal", code: "ORI", modes: ["rail", "road", "ocean"], reliability: 0.89, costIndex: 0.68 },
  { id: "car-sable", name: "Sable Priority", code: "SBP", modes: ["air", "road"], reliability: 0.95, costIndex: 1.31 },
];

export const CUSTOMER_NAMES: ReadonlyArray<readonly [string, string]> = [
  ["Halcyon Medical", "Healthcare"],
  ["Vantablack Optics", "Industrial"],
  ["Kestrel Robotics", "Manufacturing"],
  ["Lumen Semiconductor", "Electronics"],
  ["Fable & Co.", "Retail"],
  ["Ironpine Outdoors", "Consumer Goods"],
  ["Solstice Beverages", "Food & Beverage"],
  ["Nordvik Marine", "Marine"],
  ["Aperture Labs Group", "Research"],
  ["Bright Harbor Foods", "Food & Beverage"],
  ["Corvus Aerospace", "Aerospace"],
  ["Delta Vine Wines", "Food & Beverage"],
  ["Emberline Apparel", "Apparel"],
  ["Fairmont Pharma", "Pharmaceutical"],
  ["Granite Bay Tools", "Industrial"],
  ["Helio Energy Systems", "Energy"],
  ["Indigo Print Works", "Printing"],
  ["Juniper Home", "Home Goods"],
  ["Karst Mining Supply", "Mining"],
  ["Larkspur Cosmetics", "Beauty"],
  ["Monarch Automotive", "Automotive"],
  ["Nimbus Cloud Hardware", "Technology"],
  ["Orchard Lane Organics", "Agriculture"],
  ["Pallas Chemicals", "Chemicals"],
  ["Quarry Road Ceramics", "Materials"],
  ["Redwood Instruments", "Instrumentation"],
  ["Sierra Textiles", "Textiles"],
  ["Tidewater Seafood", "Food & Beverage"],
  ["Umbra Lighting", "Lighting"],
  ["Verdant AgriTech", "Agriculture"],
  ["Westgate Furniture", "Furniture"],
  ["Yarrow Nutrition", "Nutrition"],
  ["Zephyr Wind Parts", "Energy"],
  ["Atlas Sporting Club", "Sporting Goods"],
  ["Beacon Med Devices", "Healthcare"],
  ["Cobalt Battery Co.", "Energy"],
  ["Dunmore Whisky", "Food & Beverage"],
  ["Everline Packaging", "Packaging"],
  ["Foxglove Botanicals", "Beauty"],
  ["Gilded Age Antiques", "Luxury"],
];

export const FIRST_NAMES = [
  "Amara", "Bilal", "Carmen", "Dmitri", "Elena", "Farid", "Grace", "Hiro",
  "Imani", "Jonas", "Katya", "Liam", "Mira", "Noor", "Oscar", "Priya",
  "Quinn", "Rafael", "Sofia", "Tomas", "Uma", "Viktor", "Wren", "Xiulan",
  "Yusuf", "Zara", "Ade", "Beatriz", "Caleb", "Dilara",
];

export const LAST_NAMES = [
  "Okafor", "Haddad", "Ruiz", "Volkov", "Petrova", "Nasser", "Whitfield",
  "Tanaka", "Mbeki", "Lindqvist", "Sokolova", "Byrne", "Kapoor", "Rahman",
  "Delgado", "Menon", "Fitzgerald", "Moreau", "Castellanos", "Novak",
  "Aziz", "Ibrahim", "Larsen", "Chen", "Silva", "Adeyemi", "Kowalski",
  "Bergstrom", "Duarte", "Yilmaz",
];

export const STREETS = [
  "Harbor Point Rd", "Kingsway Ave", "Meridian Blvd", "Foundry St",
  "Northgate Terrace", "Cedar Mill Ln", "Dockside Way", "Union Wharf",
  "Alder Grove", "Ironworks Row", "Beacon Hill Rd", "Copper Lane",
  "Sailmaker St", "Granary Court", "Stonebridge Pkwy", "Old Mint Rd",
];

export const ITEM_DESCRIPTIONS: ReadonlyArray<readonly [string, string]> = [
  ["Precision bearing assembly", "8482.10"],
  ["Lithium-ion battery pack", "8507.60"],
  ["Refrigerated vaccine tray", "3002.20"],
  ["Carbon fibre panel set", "6815.10"],
  ["Industrial servo motor", "8501.52"],
  ["Optical lens module", "9002.11"],
  ["Stainless steel fittings", "7307.29"],
  ["Organic coffee beans", "0901.11"],
  ["Textile roll, 80m", "5407.61"],
  ["Ceramic substrate wafer", "6909.19"],
  ["Hydraulic pump unit", "8413.60"],
  ["Medical infusion pump", "9018.90"],
  ["Semiconductor test board", "8534.00"],
  ["Marine navigation console", "9014.80"],
  ["Cold-pressed olive oil", "1509.10"],
  ["Aircraft fastener kit", "7318.15"],
  ["LED luminaire array", "9405.40"],
  ["Polymer resin pellets", "3901.10"],
];

export const SERVICE_LEVELS: ServiceLevel[] = [
  "economy",
  "standard",
  "express",
  "priority_overnight",
];

export const SERVICE_LABELS: Record<ServiceLevel, string> = {
  economy: "Economy",
  standard: "Standard",
  express: "Express",
  priority_overnight: "Priority Overnight",
};

export const MODE_LABELS: Record<TransportMode, string> = {
  air: "Air",
  ocean: "Ocean",
  road: "Road",
  rail: "Rail",
};

export const EXCEPTION_REASONS: Record<
  ExceptionReason,
  { label: string; detail: string; severity: Severity }
> = {
  customs_documentation: {
    label: "Customs documentation",
    detail: "Commercial invoice mismatch flagged by destination customs authority.",
    severity: "high",
  },
  weather_delay: {
    label: "Weather delay",
    detail: "Severe weather at transit hub has grounded outbound departures.",
    severity: "medium",
  },
  mechanical_failure: {
    label: "Mechanical failure",
    detail: "Vehicle removed from service; freight is being re-tendered.",
    severity: "high",
  },
  address_unverified: {
    label: "Address unverified",
    detail: "Delivery address failed validation and requires confirmation.",
    severity: "low",
  },
  recipient_unavailable: {
    label: "Recipient unavailable",
    detail: "No authorised signatory present at the delivery window.",
    severity: "low",
  },
  capacity_shortfall: {
    label: "Capacity shortfall",
    detail: "Linehaul overbooked; freight rolled to the next available departure.",
    severity: "medium",
  },
  damaged_packaging: {
    label: "Damaged packaging",
    detail: "Outer packaging compromised during handling; repack in progress.",
    severity: "medium",
  },
};

export const OPS_AUTHORS = [
  "M. Delgado",
  "A. Okafor",
  "J. Lindqvist",
  "S. Rahman",
  "T. Castellanos",
];
