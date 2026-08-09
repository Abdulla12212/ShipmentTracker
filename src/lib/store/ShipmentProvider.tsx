"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { generateDataset, INITIAL_DATASET } from "@/lib/seed/generate";
import {
  createInitialState,
  reducer,
  type Action,
  type AppState,
  type SimSpeed,
} from "@/lib/store/reducer";

interface StoreValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  resetDemo: () => void;
  setTheme: (theme: "dark" | "light") => void;
  setSimulation: (opts: { running?: boolean; speed?: SimSpeed }) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function readTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEYS.theme);
  return stored === "light" ? "light" : "dark";
}

function readPersistedDataset() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.dataset);
    if (!raw) return null;
    return JSON.parse(raw) as AppState["dataset"];
  } catch {
    return null;
  }
}

export function ShipmentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialState(INITIAL_DATASET, "dark"),
  );
  const hydrated = useRef(false);
  const clockRef = useRef(state.clock);
  const runningRef = useRef(state.simulationRunning);
  const speedRef = useRef(state.simulationSpeed);

  useEffect(() => {
    clockRef.current = state.clock;
  }, [state.clock]);
  useEffect(() => {
    runningRef.current = state.simulationRunning;
  }, [state.simulationRunning]);
  useEffect(() => {
    speedRef.current = state.simulationSpeed;
  }, [state.simulationSpeed]);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const theme = readTheme();
    const dataset = readPersistedDataset();
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "light") {
      dispatch({ type: "SET_THEME", theme });
    }
    if (dataset?.shipments?.length) {
      dispatch({
        type: "HYDRATE",
        payload: { dataset, theme },
      });
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.dataset, JSON.stringify(state.dataset));
    } catch {
      // ignore quota errors in demo
    }
  }, [state.dataset]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
    window.localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  }, [state.theme]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!runningRef.current) return;
      const next = clockRef.current + 1000 * speedRef.current;
      dispatch({ type: "TICK", now: next });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      dispatch,
      resetDemo: () => {
        window.localStorage.removeItem(STORAGE_KEYS.dataset);
        dispatch({ type: "RESET", payload: generateDataset() });
        dispatch({
          type: "PUSH_TOAST",
          toast: { title: "Demo reset", body: "Seed data restored.", tone: "info" },
        });
      },
      setTheme: (theme) => dispatch({ type: "SET_THEME", theme }),
      setSimulation: (opts) => dispatch({ type: "SET_SIM", ...opts }),
    }),
    [state],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within ShipmentProvider");
  return ctx;
}

export function useDataset() {
  return useStore().state.dataset;
}

export function useDispatch() {
  return useStore().dispatch;
}
