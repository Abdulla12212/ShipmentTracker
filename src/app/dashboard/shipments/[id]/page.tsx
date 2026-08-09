"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { WorldMap, routesFromShipments } from "@/components/map/WorldMap";
import { DocumentList } from "@/components/shipment/DocumentList";
import { RouteProgress } from "@/components/shipment/RouteProgress";
import { TemperatureChart } from "@/components/shipment/TemperatureChart";
import { Timeline } from "@/components/shipment/Timeline";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  formatCurrency,
  formatDateTime,
  formatKg,
  formatRelative,
  modeLabel,
  serviceLabel,
} from "@/lib/format";
import { hubLabel } from "@/lib/seed/geo";
import { EXCEPTION_REASONS } from "@/lib/seed/reference";
import { nextStatus } from "@/lib/status";
import { useDataset, useDispatch, useStore } from "@/lib/store/ShipmentProvider";
import { carrierName, customerName } from "@/lib/store/selectors";

const TABS = ["Timeline", "Route", "Contents", "Documents", "Cold chain", "Notes"] as const;

export default function ShipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const dataset = useDataset();
  const dispatch = useDispatch();
  const { state } = useStore();
  const shipment = useMemo(
    () => dataset.shipments.find((s) => s.id === id),
    [dataset.shipments, id],
  );
  const [tab, setTab] = useState<(typeof TABS)[number]>("Timeline");
  const [note, setNote] = useState("");

  if (!shipment) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-medium text-fg">Shipment not found</p>
        <Link href="/dashboard/shipments/" className="mt-3 inline-block text-accent hover:underline">
          Back to shipments
        </Link>
      </div>
    );
  }

  const nxt = nextStatus(shipment.status);
  const driver = dataset.drivers.find((d) => d.id === shipment.driverId);
  const vehicle = dataset.vehicles.find((v) => v.id === shipment.vehicleId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/dashboard/shipments/" className="text-xs text-subtle hover:text-muted">
            ← Shipments
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-fg">
              {shipment.trackingNumber}
            </h1>
            <StatusPill status={shipment.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {customerName(dataset, shipment.customerId)} · {shipment.reference} ·{" "}
            {carrierName(dataset, shipment.carrierId)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{serviceLabel(shipment.serviceLevel)}</Badge>
            <Badge tone="info">{modeLabel(shipment.mode)}</Badge>
            {shipment.temperatureControlled ? <Badge tone="accent">Cold chain</Badge> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {nxt ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => dispatch({ type: "ADVANCE_STATUS", shipmentId: shipment.id })}
            >
              Advance to {nxt.replaceAll("_", " ")}
            </Button>
          ) : null}
          {shipment.exception && !shipment.exception.resolvedAt ? (
            <Button
              size="sm"
              onClick={() => dispatch({ type: "RESOLVE_EXCEPTION", shipmentId: shipment.id })}
            >
              Resolve exception
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() =>
                dispatch({ type: "INJECT_EXCEPTION", shipmentId: shipment.id })
              }
            >
              Flag exception
            </Button>
          )}
          <Link
            href={`/track/${shipment.trackingNumber}/`}
            className="inline-flex h-8 items-center rounded-lg border border-border px-2.5 text-xs text-muted hover:text-fg"
          >
            Public view
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs text-muted">Origin</p>
          <p className="mt-1 text-sm font-medium text-fg">{hubLabel(shipment.originHubId)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Destination</p>
          <p className="mt-1 text-sm font-medium text-fg">{hubLabel(shipment.destinationHubId)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">ETA</p>
          <p className="tnum mt-1 text-sm font-medium text-fg">
            {formatDateTime(shipment.estimatedDelivery)}
          </p>
          <p className="text-xs text-subtle">{formatRelative(shipment.estimatedDelivery, state.clock)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Cost / Weight</p>
          <p className="tnum mt-1 text-sm font-medium text-fg">
            {formatCurrency(shipment.costUsd)} · {formatKg(shipment.weightKg)}
          </p>
        </Card>
      </div>

      {shipment.exception && !shipment.exception.resolvedAt ? (
        <Card className="border-warning/40 bg-warning/5">
          <p className="text-sm font-medium text-fg">
            {EXCEPTION_REASONS[shipment.exception.reason].label}
          </p>
          <p className="mt-1 text-sm text-muted">{shipment.exception.detail}</p>
        </Card>
      ) : null}

      <Card>
        <RouteProgress
          originHubId={shipment.originHubId}
          destinationHubId={shipment.destinationHubId}
          progress={shipment.progress}
        />
      </Card>

      <div className="flex flex-wrap gap-1 border-b border-border pb-2">
        {TABS.map((t) => {
          if (t === "Cold chain" && !shipment.temperatureControlled) return null;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                tab === t
                  ? "rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent"
                  : "rounded-lg px-3 py-1.5 text-xs text-muted hover:text-fg"
              }
            >
              {t}
            </button>
          );
        })}
      </div>

      {tab === "Timeline" ? (
        <Card>
          <Timeline events={shipment.events} currentStatus={shipment.status} />
        </Card>
      ) : null}

      {tab === "Route" ? (
        <Card padding="none">
          <WorldMap
            className="h-96"
            routes={routesFromShipments([shipment])}
            highlightHubIds={[shipment.originHubId, shipment.destinationHubId]}
          />
          <div className="grid gap-4 border-t border-border p-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-subtle">Driver</p>
              <p className="text-sm text-fg">{driver?.name ?? "—"}</p>
              <p className="text-xs text-muted">{driver?.phone}</p>
            </div>
            <div>
              <p className="text-xs text-subtle">Vehicle</p>
              <p className="text-sm text-fg">
                {vehicle?.label} · {vehicle?.type}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {tab === "Contents" ? (
        <Card>
          <CardHeader title="Line items" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-subtle">
                <tr>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">SKU</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2">Weight</th>
                  <th className="pb-2">Value</th>
                  <th className="pb-2">HS</th>
                </tr>
              </thead>
              <tbody>
                {shipment.items.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="py-2.5">{item.description}</td>
                    <td className="py-2.5 font-mono text-xs text-muted">{item.sku}</td>
                    <td className="tnum py-2.5">{item.quantity}</td>
                    <td className="tnum py-2.5">{formatKg(item.weightKg)}</td>
                    <td className="tnum py-2.5">{formatCurrency(item.valueUsd)}</td>
                    <td className="py-2.5 text-xs text-muted">{item.hsCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm md:grid-cols-3">
            <div>
              <dt className="text-xs text-subtle">Volume</dt>
              <dd className="tnum">{shipment.volumeM3} m³</dd>
            </div>
            <div>
              <dt className="text-xs text-subtle">Declared value</dt>
              <dd className="tnum">{formatCurrency(shipment.declaredValueUsd)}</dd>
            </div>
            <div>
              <dt className="text-xs text-subtle">Total weight</dt>
              <dd className="tnum">{formatKg(shipment.weightKg)}</dd>
            </div>
          </dl>
        </Card>
      ) : null}

      {tab === "Documents" ? (
        <Card>
          <DocumentList documents={shipment.documents} />
        </Card>
      ) : null}

      {tab === "Cold chain" && shipment.temperatureControlled ? (
        <Card>
          <CardHeader
            title="Temperature log"
            subtitle="Target band 2–8°C"
          />
          <TemperatureChart readings={shipment.temperatureReadings} />
        </Card>
      ) : null}

      {tab === "Notes" ? (
        <Card className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!note.trim()) return;
              dispatch({ type: "ADD_NOTE", shipmentId: shipment.id, body: note.trim() });
              setNote("");
            }}
            className="space-y-2"
          >
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add an internal note…"
            />
            <Button type="submit" size="sm" variant="primary">
              Post note
            </Button>
          </form>
          <ul className="space-y-3">
            {shipment.notes.map((n) => (
              <li key={n.id} className="rounded-lg border border-border bg-surface-2/50 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-fg">{n.author}</span>
                  <span className="tnum text-subtle">{formatDateTime(n.at)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{n.body}</p>
              </li>
            ))}
            {!shipment.notes.length ? (
              <p className="text-sm text-muted">No notes yet.</p>
            ) : null}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
