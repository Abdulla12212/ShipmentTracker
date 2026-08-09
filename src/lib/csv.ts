import { hubLabel } from "@/lib/seed/geo";
import { statusLabel, serviceLabel } from "@/lib/format";
import type { Dataset, Shipment } from "@/lib/types";
import { carrierName, customerName } from "@/lib/store/selectors";

export function shipmentsToCsv(dataset: Dataset, shipments: Shipment[]): string {
  const headers = [
    "trackingNumber",
    "status",
    "customer",
    "carrier",
    "service",
    "origin",
    "destination",
    "reference",
    "weightKg",
    "costUsd",
    "estimatedDelivery",
  ];
  const rows = shipments.map((s) =>
    [
      s.trackingNumber,
      statusLabel(s.status),
      customerName(dataset, s.customerId),
      carrierName(dataset, s.carrierId),
      serviceLabel(s.serviceLevel),
      hubLabel(s.originHubId),
      hubLabel(s.destinationHubId),
      s.reference,
      s.weightKg,
      s.costUsd,
      new Date(s.estimatedDelivery).toISOString(),
    ]
      .map((cell) => {
        const value = String(cell);
        return value.includes(",") || value.includes('"')
          ? `"${value.replaceAll('"', '""')}"`
          : value;
      })
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
