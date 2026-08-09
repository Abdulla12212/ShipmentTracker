"use client";

import {
  BarChart3,
  LayoutDashboard,
  Map,
  Menu,
  Package,
  Settings,
  TriangleAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { DemoControls } from "@/components/ui/DemoControls";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BRAND } from "@/lib/constants";
import { cx } from "@/lib/format";

const NAV = [
  { href: "/dashboard/", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/shipments/", label: "Shipments", icon: Package },
  { href: "/dashboard/map/", label: "Live map", icon: Map },
  { href: "/dashboard/exceptions/", label: "Exceptions", icon: TriangleAlert },
  { href: "/dashboard/analytics/", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings/", label: "Settings", icon: Settings },
];

export function OpsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg md:grid md:grid-cols-[240px_1fr]">
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 w-[240px] border-r border-border bg-surface/95 p-4 backdrop-blur transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-fg">
              M
            </span>
            <div>
              <p className="text-sm font-semibold text-fg">{BRAND.product}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-subtle">Ops</p>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-md p-1 text-muted md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard/"
                ? pathname === "/dashboard/" || pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cx(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent/12 text-accent"
                    : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute right-4 bottom-4 left-4 hidden md:block">
          <Link href="/" className="text-xs text-subtle hover:text-muted">
            ← Customer tracking
          </Link>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md p-2 text-muted hover:bg-surface-2 md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <CommandPalette />
          </div>
          <div className="flex items-center gap-2">
            <DemoControls compact />
            <ThemeToggle />
          </div>
        </header>
        <main className="px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
