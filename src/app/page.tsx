"use client";

import { motion } from "framer-motion";
import { ArrowRight, PackageSearch } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/Button";
import { BRAND, STORAGE_KEYS } from "@/lib/constants";
import { cx } from "@/lib/format";
import { useDataset } from "@/lib/store/ShipmentProvider";
import { sampleTrackingNumbers } from "@/lib/store/selectors";

const EMPTY_RECENT: string[] = [];

let cachedRecentRaw: string | null = null;
let cachedRecent: string[] = EMPTY_RECENT;

function subscribeRecent(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.recent);
    if (raw === cachedRecentRaw) return cachedRecent;
    cachedRecentRaw = raw;
    cachedRecent = raw ? (JSON.parse(raw) as string[]) : EMPTY_RECENT;
    return cachedRecent;
  } catch {
    cachedRecentRaw = null;
    cachedRecent = EMPTY_RECENT;
    return EMPTY_RECENT;
  }
}

function getServerRecent(): string[] {
  return EMPTY_RECENT;
}

export default function HomePage() {
  const dataset = useDataset();
  const router = useRouter();
  const samples = useMemo(() => sampleTrackingNumbers(dataset, 4), [dataset]);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const recent = useSyncExternalStore(subscribeRecent, readRecent, getServerRecent);

  function submit(tracking?: string) {
    const tn = (tracking ?? value).trim().toUpperCase();
    if (!tn) {
      setError("Enter a tracking number to continue.");
      return;
    }
    const match = dataset.shipments.find(
      (s) => s.trackingNumber.toUpperCase() === tn,
    );
    if (!match) {
      setError("No shipment found. Try one of the sample numbers below.");
      return;
    }
    setError("");
    const nextRecent = [
      match.trackingNumber,
      ...recent.filter((r) => r !== match.trackingNumber),
    ].slice(0, 5);
    window.localStorage.setItem(STORAGE_KEYS.recent, JSON.stringify(nextRecent));
    window.dispatchEvent(new Event("storage"));
    router.push(`/track/${match.trackingNumber}/`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-70" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_65%)]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-20%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.12),transparent_65%)]" />

      <PublicHeader />

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl flex-col justify-center px-5 pb-16 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
            {BRAND.name} logistics
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-fg md:text-7xl">
            {BRAND.name}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted md:text-xl">
            Know where every shipment is — from origin dock to final signature.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor="tracking" className="sr-only">
            Tracking number
          </label>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/80 p-2 shadow-[var(--shadow-card)] backdrop-blur md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-3 px-3">
              <PackageSearch className="h-5 w-5 text-accent" />
              <input
                id="tracking"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="SHP-2401881"
                className="h-12 w-full bg-transparent font-mono text-base tracking-wide text-fg outline-none placeholder:text-subtle"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <Button type="submit" variant="primary" size="lg" className="md:min-w-40">
              Track shipment
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="mt-8"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.16em] text-subtle">
            Try a sample
          </p>
          <div className="flex flex-wrap gap-2">
            {samples.map((tn) => (
              <button
                key={tn}
                type="button"
                onClick={() => submit(tn)}
                className={cx(
                  "rounded-full border border-border bg-surface-2 px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent/40 hover:text-accent",
                )}
              >
                {tn}
              </button>
            ))}
          </div>
          {recent.length ? (
            <div className="mt-6">
              <p className="mb-2 text-xs text-subtle">Recently viewed</p>
              <div className="flex flex-wrap gap-2">
                {recent.map((tn) => (
                  <Link
                    key={tn}
                    href={`/track/${tn}/`}
                    className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline"
                  >
                    {tn}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </motion.div>
      </main>
    </div>
  );
}
