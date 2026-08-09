import type { Metadata } from "next";
import { INITIAL_DATASET } from "@/lib/seed/generate";

export function generateStaticParams() {
  return INITIAL_DATASET.shipments.map((s) => ({
    trackingNumber: s.trackingNumber,
  }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ trackingNumber: string }>;
}): Promise<Metadata> {
  return params.then(({ trackingNumber }) => ({
    title: `Track ${trackingNumber}`,
  }));
}

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
