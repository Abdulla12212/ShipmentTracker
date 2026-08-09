import type { Metadata } from "next";
import { INITIAL_DATASET } from "@/lib/seed/generate";

export function generateStaticParams() {
  return INITIAL_DATASET.shipments.map((s) => ({ id: s.id }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return params.then(({ id }) => {
    const shipment = INITIAL_DATASET.shipments.find((s) => s.id === id);
    return { title: shipment?.trackingNumber ?? "Shipment" };
  });
}

export default function ShipmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
