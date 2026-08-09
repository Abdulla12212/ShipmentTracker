"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import { WorldMap, routesFromShipments } from "@/components/map/WorldMap";
import { Card, CardHeader } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { Sparkline } from "@/components/ui/Sparkline";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatNumber, formatPercent, statusLabel } from "@/lib/format";
import { exceptionLabel } from "@/lib/format";
import { isActiveStatus } from "@/lib/status";
import { useDataset, useStore } from "@/lib/store/ShipmentProvider";
import { computeKpis, openExceptions, statusCounts } from "@/lib/store/selectors";

export default function DashboardPage() {
  const dataset = useDataset();
  const { state } = useStore();
  const kpis = useMemo(() => computeKpis(dataset, state.clock), [dataset, state.clock]);
  const exceptions = useMemo(() => openExceptions(dataset).slice(0, 6), [dataset]);
  const counts = useMemo(() => statusCounts(dataset), [dataset]);
  const activeShipments = useMemo(
    () => dataset.shipments.filter((s) => isActiveStatus(s.status)),
    [dataset.shipments],
  );

  const fleet = [
    { key: "in_transit", label: "In transit", color: "var(--info)" },
    { key: "at_hub", label: "At hub", color: "var(--violet)" },
    { key: "out_for_delivery", label: "Out for delivery", color: "var(--accent)" },
    { key: "delayed", label: "Delayed", color: "var(--warning)" },
    { key: "delivered", label: "Delivered", color: "var(--success)" },
  ] as const;

  const fleetTotal = fleet.reduce((sum, f) => sum + (counts[f.key] ?? 0), 0) || 1;

  const cards = [
    {
      label: "Active shipments",
      value: kpis.active,
      format: (n: number) => formatNumber(Math.round(n)),
      spark: kpis.activeSpark,
      stroke: "var(--accent)",
    },
    {
      label: "On-time rate",
      value: kpis.onTimeRate,
      format: (n: number) => formatPercent(n, 1),
      spark: kpis.onTimeSpark,
      stroke: "var(--success)",
    },
    {
      label: "Exceptions open",
      value: kpis.exceptionsOpen,
      format: (n: number) => formatNumber(Math.round(n)),
      spark: kpis.exceptionSpark,
      stroke: "var(--warning)",
    },
    {
      label: "Avg transit",
      value: kpis.avgTransitDays,
      format: (n: number) => `${n.toFixed(1)}d`,
      spark: kpis.transitSpark,
      stroke: "var(--info)",
    },
    {
      label: "Deliveries today",
      value: kpis.deliveriesToday,
      format: (n: number) => formatNumber(Math.round(n)),
      spark: kpis.deliverySpark,
      stroke: "var(--violet)",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Operations overview</h1>
        <p className="mt-1 text-sm text-muted">
          Live network posture across {dataset.shipments.length} shipments and {dataset.hubs.length} hubs.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card glow className="h-full">
              <p className="text-xs text-muted">{card.label}</p>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p className="text-2xl font-semibold tracking-tight text-fg">
                  <CountUp value={card.value} format={card.format} />
                </p>
                <Sparkline data={card.spark} stroke={card.stroke} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card padding="none">
          <div className="border-b border-border px-4 py-3">
            <CardHeader
              title="Global live map"
              subtitle={`${activeShipments.length} active movements`}
            />
          </div>
          <WorldMap
            className="h-[360px]"
            routes={routesFromShipments(activeShipments)}
          />
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Fleet status" subtitle="Share of network by state" />
            <div className="flex items-center gap-5">
              <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0">
                {(() => {
                  let offset = 0;
                  const r = 44;
                  const c = 2 * Math.PI * r;
                  return fleet.map((slice) => {
                    const value = counts[slice.key] ?? 0;
                    const len = (value / fleetTotal) * c;
                    const el = (
                      <circle
                        key={slice.key}
                        cx="60"
                        cy="60"
                        r={r}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth="12"
                        strokeDasharray={`${len} ${c - len}`}
                        strokeDashoffset={-offset}
                        transform="rotate(-90 60 60)"
                      />
                    );
                    offset += len;
                    return el;
                  });
                })()}
                <circle cx="60" cy="60" r="30" fill="var(--surface)" />
                <text
                  x="60"
                  y="58"
                  textAnchor="middle"
                  fill="var(--fg)"
                  fontSize="16"
                  fontWeight="600"
                >
                  {activeShipments.length}
                </text>
                <text x="60" y="74" textAnchor="middle" fill="var(--subtle)" fontSize="8">
                  ACTIVE
                </text>
              </svg>
              <ul className="flex-1 space-y-2 text-sm">
                {fleet.map((f) => (
                  <li key={f.key} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-muted">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: f.color }}
                      />
                      {f.label}
                    </span>
                    <span className="tnum text-fg">{counts[f.key] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Exceptions"
              subtitle="Ranked by severity"
              action={
                <Link href="/dashboard/exceptions/" className="text-xs text-accent hover:underline">
                  View all
                </Link>
              }
            />
            <ul className="space-y-3">
              {exceptions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/dashboard/shipments/${s.id}/`}
                    className="block rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 transition-colors hover:border-border-strong"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs text-fg">{s.trackingNumber}</p>
                      <StatusPill status={s.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {s.exception ? exceptionLabel(s.exception.reason) : statusLabel(s.status)}
                    </p>
                  </Link>
                </li>
              ))}
              {!exceptions.length ? (
                <p className="text-sm text-muted">No open exceptions. Network is clean.</p>
              ) : null}
            </ul>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title="Live activity" subtitle="Simulation feed" />
        <ul className="divide-y divide-border">
          {state.activity.slice(0, 10).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/shipments/${item.shipmentId}/`}
                  className="font-mono text-xs text-accent hover:underline"
                >
                  {item.trackingNumber}
                </Link>
                <p className="truncate text-muted">{item.message}</p>
              </div>
              <StatusPill status={item.status} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
