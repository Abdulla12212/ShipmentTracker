"use client";

import { DemoControls } from "@/components/ui/DemoControls";
import { Card, CardHeader } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BRAND } from "@/lib/constants";
import { useDataset, useStore } from "@/lib/store/ShipmentProvider";

export default function SettingsPage() {
  const dataset = useDataset();
  const { state } = useStore();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Demo controls and appearance for live client presentations.
        </p>
      </div>

      <Card>
        <CardHeader title="Appearance" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-fg">Theme</p>
            <p className="text-xs text-muted">Currently {state.theme}</p>
          </div>
          <ThemeToggle />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Demo controls"
          subtitle="Pause, speed up, inject exceptions, or reset seed data"
        />
        <DemoControls />
      </Card>

      <Card>
        <CardHeader title="Dataset" />
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-subtle">Shipments</dt>
            <dd className="tnum text-fg">{dataset.shipments.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Customers</dt>
            <dd className="tnum text-fg">{dataset.customers.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Carriers</dt>
            <dd className="tnum text-fg">{dataset.carriers.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Hubs</dt>
            <dd className="tnum text-fg">{dataset.hubs.length}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader title="About this prototype" />
        <p className="text-sm text-muted">
          {BRAND.product} is a client-only Next.js prototype — no backend, no APIs, no
          database. All freight movement is simulated in the browser from deterministic seed
          data so demos stay reliable offline.
        </p>
      </Card>
    </div>
  );
}
