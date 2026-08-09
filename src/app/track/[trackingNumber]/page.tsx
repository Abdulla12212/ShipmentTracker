"use client";

import { motion } from "framer-motion";
import {
  Bell,
  MapPin,
  Package,
  PenLine,
  ShieldAlert,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { WorldMap, routesFromShipments } from "@/components/map/WorldMap";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RouteProgress } from "@/components/shipment/RouteProgress";
import { Timeline } from "@/components/shipment/Timeline";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  formatCurrency,
  formatDateTime,
  formatEta,
  formatKg,
  modeLabel,
  serviceLabel,
} from "@/lib/format";
import { hubLabel } from "@/lib/seed/geo";
import { EXCEPTION_REASONS } from "@/lib/seed/reference";
import { useDataset, useDispatch } from "@/lib/store/ShipmentProvider";
import { carrierName } from "@/lib/store/selectors";

export default function TrackPage() {
  const params = useParams<{ trackingNumber: string }>();
  const trackingNumber = decodeURIComponent(params.trackingNumber).toUpperCase();
  const dataset = useDataset();
  const dispatch = useDispatch();
  const shipment = useMemo(
    () =>
      dataset.shipments.find(
        (s) => s.trackingNumber.toUpperCase() === trackingNumber,
      ),
    [dataset.shipments, trackingNumber],
  );
  const [emailOn, setEmailOn] = useState(true);
  const [smsOn, setSmsOn] = useState(false);

  useEffect(() => {
    if (!shipment) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.recent);
      const prev = raw ? (JSON.parse(raw) as string[]) : [];
      const next = [shipment.trackingNumber, ...prev.filter((r) => r !== shipment.trackingNumber)].slice(0, 5);
      window.localStorage.setItem(STORAGE_KEYS.recent, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, [shipment]);

  if (!shipment) {
    return (
      <div className="min-h-screen">
        <PublicHeader />
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="text-2xl font-semibold text-fg">Shipment not found</h1>
          <p className="mt-2 text-muted">
            We couldn&apos;t find {trackingNumber}. Check the number or try a sample from the home page.
          </p>
          <Link href="/" className="mt-6 inline-block text-accent hover:underline">
            Back to tracking
          </Link>
        </div>
      </div>
    );
  }

  const openException = shipment.exception && !shipment.exception.resolvedAt;

  return (
    <div className="min-h-screen pb-16">
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="font-mono text-xs tracking-wide text-subtle">{shipment.trackingNumber}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-fg md:text-4xl">
              {formatEta(shipment.estimatedDelivery)}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill status={shipment.status} />
              <Badge>{serviceLabel(shipment.serviceLevel)}</Badge>
              <Badge tone="info">{modeLabel(shipment.mode)}</Badge>
            </div>
          </div>
          <div className="text-sm text-muted md:text-right">
            <p>{carrierName(dataset, shipment.carrierId)}</p>
            <p className="tnum text-xs text-subtle">Ref {shipment.reference}</p>
          </div>
        </motion.div>

        {openException ? (
          <div className="mb-6 flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium text-fg">
                {EXCEPTION_REASONS[shipment.exception!.reason].label}
              </p>
              <p className="mt-1 text-sm text-muted">{shipment.exception!.detail}</p>
              <p className="mt-2 text-xs text-subtle">
                Our team is working this exception. You&apos;ll get an update when the shipment resumes.
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <RouteProgress
                  originHubId={shipment.originHubId}
                  destinationHubId={shipment.destinationHubId}
                  progress={shipment.progress}
                />
              </div>
              <WorldMap
                className="h-72"
                routes={routesFromShipments([shipment])}
                highlightHubIds={[shipment.originHubId, shipment.destinationHubId]}
              />
            </Card>

            <Card>
              <CardHeader title="Tracking history" subtitle="Milestones and scans" />
              <Timeline events={shipment.events} currentStatus={shipment.status} />
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Route" />
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-accent" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-subtle">From</p>
                    <p className="font-medium text-fg">{hubLabel(shipment.originHubId)}</p>
                    <p className="text-muted">{shipment.sender.company}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Truck className="mt-0.5 h-4 w-4 text-info" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-subtle">To</p>
                    <p className="font-medium text-fg">{hubLabel(shipment.destinationHubId)}</p>
                    <p className="text-muted">{shipment.recipient.company}</p>
                    <p className="text-xs text-subtle">
                      {shipment.recipient.addressLine}, {shipment.recipient.city}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Delivery details" />
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Recipient</dt>
                  <dd className="text-right text-fg">{shipment.recipient.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Signature</dt>
                  <dd className="text-right text-fg">
                    {shipment.signatureRequired ? "Required" : "Not required"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Weight</dt>
                  <dd className="tnum text-right text-fg">{formatKg(shipment.weightKg)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Declared value</dt>
                  <dd className="tnum text-right text-fg">
                    {formatCurrency(shipment.declaredValueUsd)}
                  </dd>
                </div>
                {shipment.deliveryInstructions ? (
                  <div>
                    <dt className="text-muted">Instructions</dt>
                    <dd className="mt-1 text-fg">{shipment.deliveryInstructions}</dd>
                  </div>
                ) : null}
              </dl>
            </Card>

            {shipment.status === "delivered" ? (
              <Card>
                <CardHeader title="Proof of delivery" />
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-2 text-accent">
                    <PenLine className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-fg">
                      Signed by {shipment.receivedBy ?? shipment.recipient.name}
                    </p>
                    <p className="font-serif text-lg italic text-muted">
                      {shipment.podSignature}
                    </p>
                    <p className="tnum text-xs text-subtle">
                      {shipment.actualDelivery ? formatDateTime(shipment.actualDelivery) : "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex h-28 items-center justify-center rounded-lg border border-dashed border-border bg-surface-2 text-xs text-subtle">
                  <Package className="mr-2 h-4 w-4" />
                  Delivery photo placeholder
                </div>
              </Card>
            ) : null}

            <Card>
              <CardHeader
                title="Notify me"
                subtitle="Demo-only — shows a confirmation toast"
              />
              <div className="space-y-3">
                <label className="flex items-center justify-between text-sm">
                  <span className="text-fg">Email updates</span>
                  <input
                    type="checkbox"
                    checked={emailOn}
                    onChange={(e) => setEmailOn(e.target.checked)}
                    className="accent-[var(--accent)]"
                  />
                </label>
                <label className="flex items-center justify-between text-sm">
                  <span className="text-fg">SMS alerts</span>
                  <input
                    type="checkbox"
                    checked={smsOn}
                    onChange={(e) => setSmsOn(e.target.checked)}
                    className="accent-[var(--accent)]"
                  />
                </label>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() =>
                    dispatch({
                      type: "PUSH_TOAST",
                      toast: {
                        title: "Notifications saved",
                        body: [
                          emailOn ? "Email" : null,
                          smsOn ? "SMS" : null,
                        ]
                          .filter(Boolean)
                          .join(" + ") || "No channels selected",
                        tone: "success",
                      },
                    })
                  }
                >
                  <Bell className="h-4 w-4" />
                  Save preferences
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
