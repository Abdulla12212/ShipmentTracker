"use client";

import { Gauge, Pause, Play, RotateCcw, Siren } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store/ShipmentProvider";
import type { SimSpeed } from "@/lib/store/reducer";

export function DemoControls({ compact = false }: { compact?: boolean }) {
  const { state, setSimulation, resetDemo, dispatch } = useStore();
  const speeds: SimSpeed[] = [1, 10, 60];

  return (
    <div
      className={
        compact
          ? "flex flex-wrap items-center gap-1.5"
          : "panel flex flex-wrap items-center gap-2 p-2"
      }
    >
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setSimulation({ running: !state.simulationRunning })}
        aria-label={state.simulationRunning ? "Pause simulation" : "Resume simulation"}
      >
        {state.simulationRunning ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
        {!compact ? (state.simulationRunning ? "Pause" : "Resume") : null}
      </Button>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-0.5">
        <Gauge className="ml-1.5 h-3.5 w-3.5 text-subtle" />
        {speeds.map((speed) => (
          <button
            key={speed}
            type="button"
            onClick={() => setSimulation({ speed })}
            className={
              state.simulationSpeed === speed
                ? "rounded-md bg-accent/20 px-2 py-1 text-[11px] font-medium text-accent"
                : "rounded-md px-2 py-1 text-[11px] text-muted hover:text-fg"
            }
          >
            {speed}x
          </button>
        ))}
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => dispatch({ type: "INJECT_EXCEPTION" })}
      >
        <Siren className="h-3.5 w-3.5" />
        {!compact ? "Inject exception" : null}
      </Button>
      <Button size="sm" variant="ghost" onClick={resetDemo}>
        <RotateCcw className="h-3.5 w-3.5" />
        {!compact ? "Reset demo" : null}
      </Button>
    </div>
  );
}
