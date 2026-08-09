"use client";

import { LayoutDashboard, Package, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDataset } from "@/lib/store/ShipmentProvider";
import { cx } from "@/lib/format";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  href: string;
  group: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dataset = useDataset();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = useMemo<CommandItem[]>(() => {
    const pages: CommandItem[] = [
      { id: "p-dash", label: "Operations overview", href: "/dashboard/", group: "Pages", hint: "Dashboard" },
      { id: "p-ship", label: "All shipments", href: "/dashboard/shipments/", group: "Pages", hint: "Shipments" },
      { id: "p-map", label: "Live network map", href: "/dashboard/map/", group: "Pages", hint: "Map" },
      { id: "p-an", label: "Analytics", href: "/dashboard/analytics/", group: "Pages", hint: "Charts" },
      { id: "p-ex", label: "Exceptions", href: "/dashboard/exceptions/", group: "Pages", hint: "At risk" },
      { id: "p-home", label: "Public tracking", href: "/", group: "Pages", hint: "Customer" },
    ];
    const shipments = dataset.shipments.slice(0, 80).map((s) => ({
      id: s.id,
      label: s.trackingNumber,
      hint: s.reference,
      href: `/dashboard/shipments/${s.id}/`,
      group: "Shipments",
    }));
    return [...pages, ...shipments];
  }, [dataset.shipments]);

  const filtered = items
    .filter((item) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.hint?.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
      );
    })
    .slice(0, 12);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg md:inline-flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search</span>
        <kbd className="ml-2 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-subtle">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/55 px-4 pt-[12vh] backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close command palette"
        onClick={() => setOpen(false)}
      />
      <div className="panel relative z-10 w-full max-w-xl overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 text-subtle" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to shipment, page, or action…"
            className="h-12 w-full bg-transparent text-sm text-fg outline-none placeholder:text-subtle"
          />
        </div>
        <ul className="max-h-80 overflow-auto p-2">
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                  router.push(item.href);
                }}
                className={cx(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface-2",
                )}
              >
                {item.group === "Shipments" ? (
                  <Package className="h-4 w-4 text-muted" />
                ) : (
                  <LayoutDashboard className="h-4 w-4 text-muted" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">{item.label}</span>
                  <span className="block text-[11px] text-subtle">
                    {item.group}
                    {item.hint ? ` · ${item.hint}` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {!filtered.length ? (
            <li className="px-3 py-8 text-center text-sm text-muted">No matches</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
