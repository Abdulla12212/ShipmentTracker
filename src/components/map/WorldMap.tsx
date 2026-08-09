"use client";

import { useMemo, useRef, useState } from "react";
import {
  HUBS,
  LAND_DOTS,
  MAP_HEIGHT,
  MAP_WIDTH,
  hubById,
  positionAlongRoute,
  project,
  routeSubpaths,
  toSvgPath,
} from "@/lib/seed/geo";
import { cx } from "@/lib/format";
import type { Shipment } from "@/lib/types";
import { isActiveStatus } from "@/lib/status";

export interface MapRoute {
  id: string;
  originHubId: string;
  destinationHubId: string;
  progress: number;
  status: Shipment["status"];
  label?: string;
  accent?: string;
}

export function WorldMap({
  routes = [],
  highlightHubIds,
  showHubs = true,
  className,
  interactive = true,
}: {
  routes?: MapRoute[];
  highlightHubIds?: string[];
  showHubs?: boolean;
  className?: string;
  interactive?: boolean;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const activeRoutes = useMemo(
    () => routes.filter((r) => isActiveStatus(r.status) || r.progress < 1),
    [routes],
  );

  const hubLoads = useMemo(() => {
    const loads = new Map<string, number>();
    for (const route of activeRoutes) {
      loads.set(route.originHubId, (loads.get(route.originHubId) ?? 0) + 1);
      loads.set(route.destinationHubId, (loads.get(route.destinationHubId) ?? 0) + 1);
    }
    return loads;
  }, [activeRoutes]);

  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-[calc(var(--radius-card)-2px)] bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.08),_transparent_55%),linear-gradient(180deg,var(--surface-2),var(--surface))] grid-bg",
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="h-full w-full touch-none"
        role="img"
        aria-label="World shipment map"
        onWheel={(e) => {
          if (!interactive) return;
          e.preventDefault();
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          setView((v) => ({ ...v, k: Math.min(3, Math.max(1, v.k * delta)) }));
        }}
        onPointerDown={(e) => {
          if (!interactive) return;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
        }}
        onPointerMove={(e) => {
          if (!drag.current || !interactive) return;
          const dx = e.clientX - drag.current.x;
          const dy = e.clientY - drag.current.y;
          setView((v) => ({
            ...v,
            x: drag.current!.vx - dx / v.k,
            y: drag.current!.vy - dy / v.k,
          }));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        <g transform={`translate(${MAP_WIDTH / 2} ${MAP_HEIGHT / 2}) scale(${view.k}) translate(${-MAP_WIDTH / 2 - view.x} ${-MAP_HEIGHT / 2 - view.y})`}>
          {LAND_DOTS.map((dot, i) => (
            <circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r={1.15}
              fill="var(--map-dot)"
            />
          ))}

          {activeRoutes.map((route) => {
            const origin = hubById(route.originHubId);
            const dest = hubById(route.destinationHubId);
            const paths = routeSubpaths(origin, dest);
            const geo = positionAlongRoute(
              route.originHubId,
              route.destinationHubId,
              route.progress,
            );
            const pos = project(geo.lat, geo.lng);
            const color =
              route.accent ??
              (route.status === "delayed" || route.status === "customs_hold"
                ? "var(--warning)"
                : route.status === "out_for_delivery"
                  ? "var(--accent)"
                  : "var(--info)");
            return (
              <g key={route.id}>
                {paths.map((pts, i) => (
                  <path
                    key={i}
                    d={toSvgPath(pts)}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.4}
                    strokeOpacity={0.55}
                    strokeDasharray="5 4"
                    style={{ animation: "dash-flow 2.4s linear infinite" }}
                  />
                ))}
                <g transform={`translate(${pos.x} ${pos.y})`}>
                  <circle r={8} fill={color} opacity={0.18}>
                    <animate
                      attributeName="r"
                      values="5;12;5"
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.35;0;0.35"
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    r={3.2}
                    fill={color}
                    stroke="var(--surface)"
                    strokeWidth={1}
                    onMouseEnter={() => setHover(route.label ?? route.id)}
                    onMouseLeave={() => setHover(null)}
                  />
                </g>
              </g>
            );
          })}

          {showHubs
            ? HUBS.map((hub) => {
                const p = project(hub.lat, hub.lng);
                const load = hubLoads.get(hub.id) ?? 0;
                const highlighted = highlightHubIds?.includes(hub.id);
                return (
                  <g key={hub.id} transform={`translate(${p.x} ${p.y})`}>
                    <circle
                      r={highlighted ? 5 : 2.6 + Math.min(3, load * 0.35)}
                      fill={highlighted ? "var(--accent)" : "var(--fg)"}
                      opacity={highlighted ? 0.95 : 0.45 + Math.min(0.4, load * 0.05)}
                    />
                    {(highlighted || load > 3) && (
                      <text
                        y={-8}
                        textAnchor="middle"
                        fill="var(--muted)"
                        fontSize="7"
                        fontFamily="var(--font-mono)"
                      >
                        {hub.code}
                      </text>
                    )}
                  </g>
                );
              })
            : null}
        </g>
      </svg>
      {hover ? (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-border bg-surface/90 px-2.5 py-1.5 text-xs text-fg backdrop-blur">
          {hover}
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.18em] text-subtle">
          Live network
        </div>
      )}
    </div>
  );
}

export function routesFromShipments(shipments: Shipment[]): MapRoute[] {
  return shipments.map((s) => ({
    id: s.id,
    originHubId: s.originHubId,
    destinationHubId: s.destinationHubId,
    progress: s.progress,
    status: s.status,
    label: s.trackingNumber,
  }));
}
