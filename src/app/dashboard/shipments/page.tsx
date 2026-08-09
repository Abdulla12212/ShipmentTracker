"use client";

import { Download, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { NewShipmentModal } from "@/components/shipment/NewShipmentModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";
import { StatusPill } from "@/components/ui/StatusPill";
import { downloadCsv, shipmentsToCsv } from "@/lib/csv";
import { formatDate, serviceLabel } from "@/lib/format";
import { hubLabel } from "@/lib/seed/geo";
import { SHIPMENT_STATUSES, type Region, type ServiceLevel, type ShipmentStatus } from "@/lib/types";
import { useDataset, useDispatch } from "@/lib/store/ShipmentProvider";
import {
  applySavedView,
  carrierName,
  customerName,
  filterShipments,
  type SavedView,
} from "@/lib/store/selectors";
import { STORAGE_KEYS } from "@/lib/constants";

const VIEWS: { id: SavedView; label: string }[] = [
  { id: "all", label: "All" },
  { id: "at_risk", label: "At risk" },
  { id: "out_for_delivery", label: "Out for delivery" },
  { id: "delivered_today", label: "Delivered today" },
];

const REGIONS: Region[] = [
  "North America",
  "South America",
  "Europe",
  "Middle East",
  "Africa",
  "Asia Pacific",
];

type SortKey = "trackingNumber" | "status" | "customer" | "eta" | "createdAt";

export default function ShipmentsPage() {
  const dataset = useDataset();
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<SavedView>("all");
  const [status, setStatus] = useState<ShipmentStatus | "">("");
  const [carrierId, setCarrierId] = useState("");
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel | "">("");
  const [originRegion, setOriginRegion] = useState<Region | "">("");
  const [exceptionOnly, setExceptionOnly] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const pageSize = 12;

  const filtered = useMemo(() => {
    const base = view === "all" ? dataset.shipments : applySavedView(dataset, view);
    const next = filterShipments(
      { ...dataset, shipments: base },
      {
        query,
        statuses: status ? [status] : undefined,
        carrierId: carrierId || undefined,
        serviceLevel: serviceLevel || undefined,
        originRegion: originRegion || undefined,
        exceptionOnly,
      },
    );
    const sorted = [...next].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "trackingNumber") return a.trackingNumber.localeCompare(b.trackingNumber) * dir;
      if (sortKey === "status") return a.status.localeCompare(b.status) * dir;
      if (sortKey === "customer") {
        return (
          customerName(dataset, a.customerId).localeCompare(customerName(dataset, b.customerId)) *
          dir
        );
      }
      if (sortKey === "eta") return (a.estimatedDelivery - b.estimatedDelivery) * dir;
      return (a.createdAt - b.createdAt) * dir;
    });
    return sorted;
  }, [
    dataset,
    view,
    query,
    status,
    carrierId,
    serviceLevel,
    originRegion,
    exceptionOnly,
    sortKey,
    sortDir,
  ]);

  const pageItems = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleAll() {
    if (selected.length === pageItems.length) setSelected([]);
    else setSelected(pageItems.map((s) => s.id));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Shipments</h1>
          <p className="mt-1 text-sm text-muted">
            {filtered.length} matching · {dataset.shipments.length} total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              downloadCsv("shipments.csv", shipmentsToCsv(dataset, filtered));
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button size="sm" variant="primary" onClick={() => setModalOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New shipment
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              setView(v.id);
              setPage(0);
              window.localStorage.setItem(STORAGE_KEYS.savedView, v.id);
            }}
            className={
              view === v.id
                ? "rounded-full bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent"
                : "rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-fg"
            }
          >
            {v.label}
          </button>
        ))}
      </div>

      <Card className="space-y-3">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          <Input
            placeholder="Search tracking, customer, city…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            className="xl:col-span-2"
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ShipmentStatus | "");
              setPage(0);
            }}
          >
            <option value="">All statuses</option>
            {SHIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
          <Select
            value={carrierId}
            onChange={(e) => {
              setCarrierId(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All carriers</option>
            {dataset.carriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            value={serviceLevel}
            onChange={(e) => {
              setServiceLevel(e.target.value as ServiceLevel | "");
              setPage(0);
            }}
          >
            <option value="">All services</option>
            <option value="economy">Economy</option>
            <option value="standard">Standard</option>
            <option value="express">Express</option>
            <option value="priority_overnight">Priority Overnight</option>
          </Select>
          <Select
            value={originRegion}
            onChange={(e) => {
              setOriginRegion(e.target.value as Region | "");
              setPage(0);
            }}
          >
            <option value="">All regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={exceptionOnly}
              onChange={(e) => {
                setExceptionOnly(e.target.checked);
                setPage(0);
              }}
              className="accent-[var(--accent)]"
            />
            Exceptions only
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={dense}
              onChange={(e) => setDense(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Compact rows
          </label>
        </div>
      </Card>

      {selected.length ? (
        <Card className="flex flex-wrap items-center gap-2 py-3">
          <span className="text-xs text-muted">{selected.length} selected</span>
          <Button
            size="sm"
            onClick={() =>
              dispatch({
                type: "REASSIGN_CARRIER",
                shipmentIds: selected,
                carrierId: dataset.carriers[0].id,
              })
            }
          >
            Reassign carrier
          </Button>
          <Button
            size="sm"
            onClick={() =>
              dispatch({
                type: "FLAG_EXCEPTION",
                shipmentIds: selected,
                reason: "capacity_shortfall",
              })
            }
          >
            Flag exception
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => dispatch({ type: "MARK_DELIVERED", shipmentIds: selected })}
          >
            Mark delivered
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const rows = dataset.shipments.filter((s) => selected.includes(s.id));
              downloadCsv("selected-shipments.csv", shipmentsToCsv(dataset, rows));
            }}
          >
            Export selected
          </Button>
        </Card>
      ) : null}

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="sticky top-0 bg-surface-2/95 text-xs uppercase tracking-wide text-subtle backdrop-blur">
              <tr className="border-b border-border">
                <th className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={pageItems.length > 0 && selected.length === pageItems.length}
                    onChange={toggleAll}
                    aria-label="Select page"
                    className="accent-[var(--accent)]"
                  />
                </th>
                {(
                  [
                    ["trackingNumber", "Tracking"],
                    ["status", "Status"],
                    ["customer", "Customer"],
                    ["eta", "ETA"],
                    ["createdAt", "Created"],
                  ] as const
                ).map(([key, label]) => (
                  <th key={key} className="px-3 py-3 font-medium">
                    <button type="button" onClick={() => toggleSort(key)} className="hover:text-fg">
                      {label}
                      {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                    </button>
                  </th>
                ))}
                <th className="px-3 py-3 font-medium">Lane</th>
                <th className="px-3 py-3 font-medium">Carrier</th>
                <th className="px-3 py-3 font-medium">Service</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border/80 transition-colors hover:bg-surface-2/50"
                >
                  <td className={dense ? "px-3 py-2" : "px-3 py-3"}>
                    <input
                      type="checkbox"
                      checked={selected.includes(s.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, s.id]
                            : prev.filter((id) => id !== s.id),
                        )
                      }
                      aria-label={`Select ${s.trackingNumber}`}
                      className="accent-[var(--accent)]"
                    />
                  </td>
                  <td className={dense ? "px-3 py-2" : "px-3 py-3"}>
                    <Link
                      href={`/dashboard/shipments/${s.id}/`}
                      className="font-mono text-xs text-accent hover:underline"
                    >
                      {s.trackingNumber}
                    </Link>
                    <p className="text-[11px] text-subtle">{s.reference}</p>
                  </td>
                  <td className={dense ? "px-3 py-2" : "px-3 py-3"}>
                    <StatusPill status={s.status} />
                  </td>
                  <td className={dense ? "px-3 py-2" : "px-3 py-3"}>
                    {customerName(dataset, s.customerId)}
                  </td>
                  <td className={`tnum ${dense ? "px-3 py-2" : "px-3 py-3"}`}>
                    {formatDate(s.estimatedDelivery)}
                  </td>
                  <td className={`tnum ${dense ? "px-3 py-2" : "px-3 py-3"}`}>
                    {formatDate(s.createdAt)}
                  </td>
                  <td className={dense ? "px-3 py-2 text-xs text-muted" : "px-3 py-3 text-xs text-muted"}>
                    {hubLabel(s.originHubId).split(" (")[0]} →{" "}
                    {hubLabel(s.destinationHubId).split(" (")[0]}
                  </td>
                  <td className={dense ? "px-3 py-2 text-xs" : "px-3 py-3 text-xs"}>
                    {carrierName(dataset, s.carrierId)}
                  </td>
                  <td className={dense ? "px-3 py-2 text-xs text-muted" : "px-3 py-3 text-xs text-muted"}>
                    {serviceLabel(s.serviceLevel)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pageItems.length ? (
            <EmptyState
              title="No shipments match"
              description="Adjust filters or reset the demo data."
            />
          ) : null}
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
          <span>
            Page {page + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              size="sm"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <NewShipmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
