import { HOUR_MS, NOW } from "@/lib/constants";
import { hubLabel } from "@/lib/seed/geo";
import { EXCEPTION_REASONS, OPS_AUTHORS } from "@/lib/seed/reference";
import { nextStatus, progressForStatus } from "@/lib/status";
import type {
  Dataset,
  ExceptionReason,
  Note,
  Shipment,
  ShipmentStatus,
  TrackingEvent,
} from "@/lib/types";

export type SimSpeed = 1 | 10 | 60;

export interface ToastItem {
  id: string;
  title: string;
  body: string;
  tone: "info" | "success" | "warning" | "danger";
  createdAt: number;
}

export interface ActivityItem {
  id: string;
  at: number;
  trackingNumber: string;
  shipmentId: string;
  message: string;
  status: ShipmentStatus;
}

export interface AppState {
  dataset: Dataset;
  clock: number;
  simulationRunning: boolean;
  simulationSpeed: SimSpeed;
  toasts: ToastItem[];
  activity: ActivityItem[];
  theme: "dark" | "light";
}

export type Action =
  | { type: "HYDRATE"; payload: Partial<AppState> }
  | { type: "RESET"; payload: Dataset }
  | { type: "SET_THEME"; theme: "dark" | "light" }
  | { type: "SET_SIM"; running?: boolean; speed?: SimSpeed }
  | { type: "TICK"; now: number }
  | { type: "DISMISS_TOAST"; id: string }
  | { type: "PUSH_TOAST"; toast: Omit<ToastItem, "id" | "createdAt"> & { id?: string } }
  | { type: "ADVANCE_STATUS"; shipmentId: string }
  | { type: "RESOLVE_EXCEPTION"; shipmentId: string }
  | { type: "INJECT_EXCEPTION"; shipmentId?: string; reason?: ExceptionReason }
  | { type: "MARK_DELIVERED"; shipmentIds: string[] }
  | { type: "REASSIGN_CARRIER"; shipmentIds: string[]; carrierId: string }
  | { type: "FLAG_EXCEPTION"; shipmentIds: string[]; reason: ExceptionReason }
  | { type: "ADD_NOTE"; shipmentId: string; body: string; author?: string }
  | { type: "CREATE_SHIPMENT"; shipment: Shipment };

function toastId() {
  return `toast-${Math.random().toString(36).slice(2, 9)}`;
}

function pushToast(
  state: AppState,
  toast: Omit<ToastItem, "id" | "createdAt"> & { id?: string },
): AppState {
  const item: ToastItem = {
    id: toast.id ?? toastId(),
    title: toast.title,
    body: toast.body,
    tone: toast.tone,
    createdAt: state.clock,
  };
  return { ...state, toasts: [item, ...state.toasts].slice(0, 5) };
}

function updateShipment(
  state: AppState,
  shipmentId: string,
  updater: (shipment: Shipment) => Shipment,
): AppState {
  return {
    ...state,
    dataset: {
      ...state.dataset,
      shipments: state.dataset.shipments.map((s) =>
        s.id === shipmentId ? updater(s) : s,
      ),
    },
  };
}

function appendEvent(shipment: Shipment, event: Omit<TrackingEvent, "id">): Shipment {
  const id = `${shipment.id}-evt-${shipment.events.length}`;
  return { ...shipment, events: [...shipment.events, { ...event, id }] };
}

function advanceOne(shipment: Shipment, clock: number): { shipment: Shipment; message?: string } {
  const nxt = nextStatus(shipment.status);
  if (!nxt) return { shipment };

  let next = {
    ...shipment,
    status: nxt,
    progress: nxt === "delivered" ? 1 : Math.min(0.95, shipment.progress + 0.12),
  };

  if (nxt === "picked_up" && !next.pickedUpAt) next.pickedUpAt = clock;
  if (nxt === "delivered") {
    next.actualDelivery = clock;
    next.progress = 1;
    next.receivedBy = next.recipient.name;
    next.podSignature = next.recipient.name
      .split(" ")
      .map((p) => p[0])
      .join(". ");
    if (next.exception && !next.exception.resolvedAt) {
      next.exception = { ...next.exception, resolvedAt: clock };
    }
  }

  const hubId =
    nxt === "delivered" || nxt === "out_for_delivery"
      ? shipment.destinationHubId
      : nxt === "picked_up"
        ? shipment.originHubId
        : shipment.events[shipment.events.length - 1]?.hubId ?? shipment.originHubId;

  next = appendEvent(next, {
    at: clock,
    status: nxt,
    hubId,
    location: hubLabel(hubId),
    description: `Status advanced to ${nxt.replaceAll("_", " ")}.`,
    kind: nxt === "delivered" ? "milestone" : "scan",
  });

  return {
    shipment: next,
    message: `${shipment.trackingNumber} → ${nxt.replaceAll("_", " ")}`,
  };
}

function simulateTick(state: AppState, now: number): AppState {
  const elapsed = now - state.clock;
  if (elapsed <= 0) return { ...state, clock: now };

  let shipments = state.dataset.shipments;
  const activity: ActivityItem[] = [...state.activity];
  let toasts = state.toasts;
  const progressDelta = (elapsed / HOUR_MS) * 0.035 * state.simulationSpeed;

  shipments = shipments.map((shipment) => {
    if (shipment.status === "delivered" || shipment.status === "cancelled") return shipment;

    let next = {
      ...shipment,
      progress: Math.min(
        shipment.status === "out_for_delivery" ? 0.98 : 0.93,
        shipment.progress + progressDelta * (0.6 + (shipment.id.charCodeAt(4) % 5) * 0.1),
      ),
    };

    // Auto-advance when progress thresholds hit
    if (next.progress > 0.2 && next.status === "label_created") {
      const result = advanceOne(next, now);
      next = result.shipment;
      if (result.message) {
        activity.unshift({
          id: `act-${now}-${shipment.id}-pu`,
          at: now,
          trackingNumber: shipment.trackingNumber,
          shipmentId: shipment.id,
          message: result.message,
          status: next.status,
        });
      }
    } else if (next.progress > 0.55 && (next.status === "picked_up" || next.status === "at_hub")) {
      const result = advanceOne({ ...next, status: next.status === "at_hub" ? "at_hub" : "picked_up" }, now);
      // manually set in_transit
      next = {
        ...result.shipment,
        status: "in_transit",
        progress: Math.max(result.shipment.progress, 0.55),
      };
      activity.unshift({
        id: `act-${now}-${shipment.id}-it`,
        at: now,
        trackingNumber: shipment.trackingNumber,
        shipmentId: shipment.id,
        message: `${shipment.trackingNumber} scan at transit hub`,
        status: "in_transit",
      });
    } else if (next.progress > 0.86 && next.status === "in_transit") {
      next = {
        ...next,
        status: "out_for_delivery",
        progress: 0.9,
      };
      next = appendEvent(next, {
        at: now,
        status: "out_for_delivery",
        hubId: next.destinationHubId,
        location: hubLabel(next.destinationHubId),
        description: "Handed to last-mile courier.",
        kind: "scan",
      });
      activity.unshift({
        id: `act-${now}-${shipment.id}-ofd`,
        at: now,
        trackingNumber: shipment.trackingNumber,
        shipmentId: shipment.id,
        message: `${shipment.trackingNumber} out for delivery`,
        status: "out_for_delivery",
      });
      const ofdToast: ToastItem = {
        id: toastId(),
        title: "Out for delivery",
        body: shipment.trackingNumber,
        tone: "info",
        createdAt: now,
      };
      toasts = [ofdToast, ...toasts].slice(0, 5);
    } else if (next.progress > 0.97 && next.status === "out_for_delivery") {
      const result = advanceOne(next, now);
      next = result.shipment;
      activity.unshift({
        id: `act-${now}-${shipment.id}-del`,
        at: now,
        trackingNumber: shipment.trackingNumber,
        shipmentId: shipment.id,
        message: `${shipment.trackingNumber} delivered`,
        status: "delivered",
      });
      const deliveredToast: ToastItem = {
        id: toastId(),
        title: "Delivered",
        body: shipment.trackingNumber,
        tone: "success",
        createdAt: now,
      };
      toasts = [deliveredToast, ...toasts].slice(0, 5);
    }

    return next;
  });

  return {
    ...state,
    clock: now,
    dataset: { ...state.dataset, shipments },
    activity: activity.slice(0, 40),
    toasts,
  };
}

export function createInitialState(dataset: Dataset, theme: "dark" | "light" = "dark"): AppState {
  return {
    dataset,
    clock: NOW,
    simulationRunning: true,
    simulationSpeed: 1,
    toasts: [],
    activity: dataset.shipments
      .flatMap((s) =>
        s.events.slice(-1).map((e) => ({
          id: e.id,
          at: e.at,
          trackingNumber: s.trackingNumber,
          shipmentId: s.id,
          message: e.description,
          status: e.status,
        })),
      )
      .sort((a, b) => b.at - a.at)
      .slice(0, 20),
    theme,
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload, dataset: action.payload.dataset ?? state.dataset };
    case "RESET":
      return createInitialState(action.payload, state.theme);
    case "SET_THEME":
      return { ...state, theme: action.theme };
    case "SET_SIM":
      return {
        ...state,
        simulationRunning: action.running ?? state.simulationRunning,
        simulationSpeed: action.speed ?? state.simulationSpeed,
      };
    case "TICK":
      if (!state.simulationRunning) return { ...state, clock: action.now };
      return simulateTick(state, action.now);
    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case "PUSH_TOAST":
      return pushToast(state, action.toast);
    case "ADVANCE_STATUS": {
      const current = state.dataset.shipments.find((s) => s.id === action.shipmentId);
      if (!current) return state;
      const { shipment, message } = advanceOne(current, state.clock);
      // Repair event location labels using hub cities happens in UI; keep hub ids
      let nextState = updateShipment(state, action.shipmentId, () => shipment);
      if (message) {
        nextState = {
          ...nextState,
          activity: [
            {
              id: `act-${state.clock}-${shipment.id}`,
              at: state.clock,
              trackingNumber: shipment.trackingNumber,
              shipmentId: shipment.id,
              message,
              status: shipment.status,
            },
            ...nextState.activity,
          ].slice(0, 40),
        };
        nextState = pushToast(nextState, {
          title: "Status updated",
          body: message,
          tone: shipment.status === "delivered" ? "success" : "info",
        });
      }
      return nextState;
    }
    case "RESOLVE_EXCEPTION":
      return updateShipment(state, action.shipmentId, (shipment) => {
        if (!shipment.exception) return shipment;
        let next: Shipment = {
          ...shipment,
          status: "in_transit",
          progress: Math.max(shipment.progress, progressForStatus("in_transit")),
          exception: { ...shipment.exception, resolvedAt: state.clock },
        };
        next = appendEvent(next, {
          at: state.clock,
          status: "in_transit",
          hubId: shipment.events[shipment.events.length - 1]?.hubId,
          location: shipment.events[shipment.events.length - 1]?.location ?? "Network",
          description: "Exception cleared. Shipment resumed.",
          kind: "note",
        });
        return next;
      });
    case "INJECT_EXCEPTION": {
      const reason = action.reason ?? "weather_delay";
      const meta = EXCEPTION_REASONS[reason];
      const candidates = state.dataset.shipments.filter(
        (s) =>
          !s.exception &&
          s.status !== "delivered" &&
          s.status !== "cancelled" &&
          s.status !== "label_created",
      );
      const target =
        (action.shipmentId
          ? state.dataset.shipments.find((s) => s.id === action.shipmentId)
          : candidates[Math.floor(Math.random() * candidates.length)]) ?? null;
      if (!target) return pushToast(state, { title: "No target", body: "No active shipment to flag.", tone: "warning" });

      let nextState = updateShipment(state, target.id, (shipment) => {
        const status: ShipmentStatus =
          reason === "customs_documentation"
            ? "customs_hold"
            : reason === "recipient_unavailable" || reason === "address_unverified"
              ? "failed_delivery"
              : "delayed";
        let next: Shipment = {
          ...shipment,
          status,
          exception: {
            reason,
            severity: meta.severity,
            detail: meta.detail,
            openedAt: state.clock,
          },
        };
        next = appendEvent(next, {
          at: state.clock,
          status,
          hubId: shipment.destinationHubId,
          location: shipment.events[shipment.events.length - 1]?.location ?? "Network",
          description: meta.detail,
          kind: "exception",
        });
        return next;
      });
      nextState = pushToast(nextState, {
        title: "Exception injected",
        body: `${target.trackingNumber}: ${meta.label}`,
        tone: "danger",
      });
      const excStatus: ShipmentStatus =
        reason === "customs_documentation"
          ? "customs_hold"
          : reason === "recipient_unavailable" || reason === "address_unverified"
            ? "failed_delivery"
            : "delayed";
      nextState = {
        ...nextState,
        activity: [
          {
            id: `act-${state.clock}-exc-${target.id}`,
            at: state.clock,
            trackingNumber: target.trackingNumber,
            shipmentId: target.id,
            message: `Exception: ${meta.label}`,
            status: excStatus,
          },
          ...nextState.activity,
        ].slice(0, 40),
      };
      return nextState;
    }
    case "MARK_DELIVERED": {
      let next = state;
      for (const id of action.shipmentIds) {
        for (let i = 0; i < 8; i += 1) {
          const current = next.dataset.shipments.find((x) => x.id === id);
          if (!current || current.status === "delivered" || current.status === "cancelled") break;
          const before = current.status;
          next = reducer(next, { type: "ADVANCE_STATUS", shipmentId: id });
          const after = next.dataset.shipments.find((x) => x.id === id);
          if (!after || after.status === before) {
            next = updateShipment(next, id, (shipment) =>
              appendEvent(
                {
                  ...shipment,
                  status: "delivered",
                  progress: 1,
                  actualDelivery: next.clock,
                  receivedBy: shipment.recipient.name,
                  podSignature: shipment.recipient.name
                    .split(" ")
                    .map((p) => p[0])
                    .join(". "),
                  exception: shipment.exception
                    ? { ...shipment.exception, resolvedAt: next.clock }
                    : undefined,
                },
                {
                  at: next.clock,
                  status: "delivered",
                  hubId: shipment.destinationHubId,
                  location: hubLabel(shipment.destinationHubId),
                  description: "Marked delivered by operations.",
                  kind: "milestone",
                },
              ),
            );
            break;
          }
        }
      }
      return pushToast(next, {
        title: "Marked delivered",
        body: `${action.shipmentIds.length} shipment(s)`,
        tone: "success",
      });
    }
    case "REASSIGN_CARRIER":
      return {
        ...state,
        dataset: {
          ...state.dataset,
          shipments: state.dataset.shipments.map((s) =>
            action.shipmentIds.includes(s.id)
              ? { ...s, carrierId: action.carrierId }
              : s,
          ),
        },
      };
    case "FLAG_EXCEPTION": {
      let next = state;
      for (const id of action.shipmentIds) {
        next = reducer(next, {
          type: "INJECT_EXCEPTION",
          shipmentId: id,
          reason: action.reason,
        });
      }
      return next;
    }
    case "ADD_NOTE":
      return updateShipment(state, action.shipmentId, (shipment) => {
        const note: Note = {
          id: `${shipment.id}-note-${shipment.notes.length}`,
          author: action.author ?? OPS_AUTHORS[0],
          at: state.clock,
          body: action.body,
        };
        return { ...shipment, notes: [note, ...shipment.notes] };
      });
    case "CREATE_SHIPMENT":
      return {
        ...state,
        dataset: {
          ...state.dataset,
          shipments: [action.shipment, ...state.dataset.shipments],
        },
        activity: [
          {
            id: `act-create-${action.shipment.id}`,
            at: state.clock,
            trackingNumber: action.shipment.trackingNumber,
            shipmentId: action.shipment.id,
            message: `Created ${action.shipment.trackingNumber}`,
            status: action.shipment.status,
          },
          ...state.activity,
        ].slice(0, 40),
      };
    default:
      return state;
  }
}
