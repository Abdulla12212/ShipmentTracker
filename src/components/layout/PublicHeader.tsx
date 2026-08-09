import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BRAND } from "@/lib/constants";

export function PublicHeader() {
  return (
    <header className="relative z-20 flex items-center justify-between px-5 py-5 md:px-10">
      <Link href="/" className="group flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-fg shadow-[0_0_32px_-6px_var(--accent)]">
          M
        </span>
        <span>
          <span className="block text-sm font-semibold tracking-tight text-fg">
            {BRAND.name}
          </span>
          <span className="block text-[11px] uppercase tracking-[0.18em] text-subtle">
            Track
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/"
          className="rounded-lg border border-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur transition-colors hover:border-border-strong hover:text-fg"
        >
          Open ops console
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
