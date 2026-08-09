"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { WorldMap, routesFromShipments } from "@/components/map/WorldMap";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { hubLabel } from "@/lib/seed/geo";
import { isActiveStatus } from "@/lib/status";
import { useDataset } from "@/lib/store/ShipmentProvider";

export default function MapPage() {
  const dataset = useDataset();
  const [query, setQuery] = useState("");
  const active = useMemo(
    () => dataset.shipments.filter((s) => isActiveStatus(s.status)),
    [dataset.shipments],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return active.slice(0, 40);
    return active.filter(
      (s) =>
        s.trackingNumber.toLowerCase().includes(q) ||
        hubLabel(s.originHubId).toLowerCase().includes(q) ||
        hubLabel(s.destinationHubId).toLowerCase().includes(q),
    );
  }, [active, query]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Live network map</h1>
        <p className="mt-1 text-sm text-muted">
          {active.length} active shipments across {dataset.hubs.length} hubs. Scroll to zoom, drag to pan.
        </p>
      </div>
      <Card padding="none">
        <WorldMap className="h-[520px]" routes={routesFromShipments(active)} />
      </Card>
      <Card>
        <CardHeader
          title="Active movements"
          action={
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter…"
              className="h-8 rounded-md border border-border bg-surface-2 px-2 text-xs text-fg outline-none"
            />
          }
        />
        <ul className="divide-y divide-border">
          {filtered.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <Link
                  href={`/dashboard/shipments/${s.id}/`}
                  className="font-mono text-xs text-accent hover:underline"
                >
                  {s.trackingNumber}
                </Link>
                <p className="text-xs text-muted">
                  {hubLabel(s.originHubId)} → {hubLabel(s.destinationHubId)}
                </p>
              </div>
              <StatusPill status={s.status} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
