"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { exceptionLabel, formatDateTime } from "@/lib/format";
import { useDataset, useDispatch } from "@/lib/store/ShipmentProvider";
import { openExceptions } from "@/lib/store/selectors";

export default function ExceptionsPage() {
  const dataset = useDataset();
  const dispatch = useDispatch();
  const exceptions = useMemo(() => openExceptions(dataset), [dataset]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Exceptions</h1>
          <p className="mt-1 text-sm text-muted">
            {exceptions.length} open · ranked by severity
          </p>
        </div>
        <Button size="sm" onClick={() => dispatch({ type: "INJECT_EXCEPTION" })}>
          Inject demo exception
        </Button>
      </div>

      <Card padding="none">
        {exceptions.length ? (
          <ul className="divide-y divide-border">
            {exceptions.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/shipments/${s.id}/`}
                      className="font-mono text-sm text-accent hover:underline"
                    >
                      {s.trackingNumber}
                    </Link>
                    <StatusPill status={s.status} />
                    <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-subtle">
                      {s.exception?.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-fg">
                    {s.exception ? exceptionLabel(s.exception.reason) : "Exception"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{s.exception?.detail}</p>
                  <p className="tnum mt-1 text-[11px] text-subtle">
                    Opened {s.exception ? formatDateTime(s.exception.openedAt) : "—"}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => dispatch({ type: "RESOLVE_EXCEPTION", shipmentId: s.id })}
                >
                  Resolve
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No open exceptions"
            description="Inject one from the demo controls to show the workflow."
          />
        )}
      </Card>

      <Card>
        <CardHeader title="Playbook" subtitle="Suggested next steps for demos" />
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Open an exception and walk through the detail page.</li>
          <li>Resolve it live — the timeline and KPIs update immediately.</li>
          <li>Use Inject exception during a pitch to create a dramatic moment.</li>
        </ol>
      </Card>
    </div>
  );
}
