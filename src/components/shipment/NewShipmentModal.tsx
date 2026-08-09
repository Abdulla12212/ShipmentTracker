"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DAY_MS, NOW } from "@/lib/constants";
import { HUBS } from "@/lib/seed/geo";
import { SERVICE_LEVELS } from "@/lib/seed/reference";
import { useDataset, useDispatch } from "@/lib/store/ShipmentProvider";
import type { ServiceLevel, Shipment, TransportMode } from "@/lib/types";

export function NewShipmentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dataset = useDataset();
  const dispatch = useDispatch();
  const [step, setStep] = useState(0);
  const [originHubId, setOrigin] = useState(HUBS[0].id);
  const [destinationHubId, setDest] = useState(HUBS[1].id);
  const [customerId, setCustomer] = useState(dataset.customers[0]?.id ?? "");
  const [carrierId, setCarrier] = useState(dataset.carriers[0]?.id ?? "");
  const [serviceLevel, setService] = useState<ServiceLevel>("standard");
  const [reference, setReference] = useState("");

  const carrier = useMemo(
    () => dataset.carriers.find((c) => c.id === carrierId),
    [dataset.carriers, carrierId],
  );

  function reset() {
    setStep(0);
    setReference("");
  }

  function create() {
    const id = `shp-new-${Date.now().toString(36)}`;
    const trackingNumber = `SHP-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const mode: TransportMode = carrier?.modes[0] ?? "road";
    const driver = dataset.drivers.find((d) => d.carrierId === carrierId) ?? dataset.drivers[0];
    const vehicle = dataset.vehicles.find((v) => v.carrierId === carrierId) ?? dataset.vehicles[0];
    const customer = dataset.customers.find((c) => c.id === customerId) ?? dataset.customers[0];
    const origin = HUBS.find((h) => h.id === originHubId)!;
    const dest = HUBS.find((h) => h.id === destinationHubId)!;

    const shipment: Shipment = {
      id,
      trackingNumber,
      reference: reference || `PO-${Math.floor(10000 + Math.random() * 90000)}`,
      status: "label_created",
      serviceLevel,
      mode,
      carrierId,
      vehicleId: vehicle.id,
      driverId: driver.id,
      customerId: customer.id,
      originHubId,
      destinationHubId,
      sender: {
        name: customer.contact,
        company: customer.name,
        addressLine: "1 Origin Way",
        city: origin.city,
        country: origin.country,
        postalCode: "00000",
        phone: "+1 555 0100",
        email: customer.email,
      },
      recipient: {
        name: "Receiving Desk",
        company: customer.name,
        addressLine: "200 Destination Ave",
        city: dest.city,
        country: dest.country,
        postalCode: "00000",
        phone: "+1 555 0101",
        email: customer.email,
      },
      createdAt: NOW,
      estimatedDelivery: NOW + 3 * DAY_MS,
      promisedDelivery: NOW + 3 * DAY_MS,
      progress: 0.02,
      events: [
        {
          id: `${id}-evt-0`,
          at: NOW,
          status: "label_created",
          hubId: originHubId,
          location: `${origin.city}, ${origin.countryCode}`,
          description: "Shipping label created and booking confirmed.",
          kind: "milestone",
        },
      ],
      items: [
        {
          id: `${id}-item-0`,
          description: "General freight",
          sku: "SKU-NEW",
          quantity: 1,
          weightKg: 12,
          valueUsd: 500,
          hsCode: "0000.00",
        },
      ],
      weightKg: 12,
      volumeM3: 0.2,
      declaredValueUsd: 500,
      costUsd: 85,
      signatureRequired: true,
      temperatureControlled: false,
      temperatureReadings: [],
      documents: [],
      notes: [],
    };

    dispatch({ type: "CREATE_SHIPMENT", shipment });
    dispatch({
      type: "PUSH_TOAST",
      toast: {
        title: "Shipment created",
        body: trackingNumber,
        tone: "success",
      },
    });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="New shipment">
      <div className="mb-4 flex gap-2">
        {["Route", "Parties", "Confirm"].map((label, i) => (
          <span
            key={label}
            className={
              i === step
                ? "rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-medium text-accent"
                : "rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-subtle"
            }
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {step === 0 ? (
        <div className="space-y-3">
          <label className="block text-xs text-muted">
            Origin hub
            <Select className="mt-1" value={originHubId} onChange={(e) => setOrigin(e.target.value)}>
              {HUBS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.city} ({h.code})
                </option>
              ))}
            </Select>
          </label>
          <label className="block text-xs text-muted">
            Destination hub
            <Select
              className="mt-1"
              value={destinationHubId}
              onChange={(e) => setDest(e.target.value)}
            >
              {HUBS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.city} ({h.code})
                </option>
              ))}
            </Select>
          </label>
          <label className="block text-xs text-muted">
            Service level
            <Select
              className="mt-1"
              value={serviceLevel}
              onChange={(e) => setService(e.target.value as ServiceLevel)}
            >
              {SERVICE_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-3">
          <label className="block text-xs text-muted">
            Customer
            <Select className="mt-1" value={customerId} onChange={(e) => setCustomer(e.target.value)}>
              {dataset.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block text-xs text-muted">
            Carrier
            <Select className="mt-1" value={carrierId} onChange={(e) => setCarrier(e.target.value)}>
              {dataset.carriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block text-xs text-muted">
            Reference
            <Input
              className="mt-1"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PO-12345"
            />
          </label>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-2 text-sm text-muted">
          <p>
            <span className="text-fg">Route:</span>{" "}
            {HUBS.find((h) => h.id === originHubId)?.code} →{" "}
            {HUBS.find((h) => h.id === destinationHubId)?.code}
          </p>
          <p>
            <span className="text-fg">Customer:</span>{" "}
            {dataset.customers.find((c) => c.id === customerId)?.name}
          </p>
          <p>
            <span className="text-fg">Carrier:</span> {carrier?.name}
          </p>
          <p>
            <span className="text-fg">Service:</span> {serviceLevel.replaceAll("_", " ")}
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex justify-between gap-2">
        <Button
          variant="ghost"
          onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
        >
          {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < 2 ? (
          <Button variant="primary" onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button variant="primary" onClick={create}>
            Create shipment
          </Button>
        )}
      </div>
    </Modal>
  );
}
