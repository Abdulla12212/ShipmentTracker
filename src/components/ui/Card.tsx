import { cx } from "@/lib/format";

export function Card({
  children,
  className,
  glow = false,
  padding = "md",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}) {
  const pad =
    padding === "none"
      ? ""
      : padding === "sm"
        ? "p-3"
        : padding === "lg"
          ? "p-6"
          : "p-4";
  return (
    <div
      className={cx(
        "panel relative overflow-hidden",
        pad,
        glow &&
          "before:pointer-events-none before:absolute before:-top-16 before:right-0 before:h-40 before:w-40 before:rounded-full before:bg-accent/10 before:blur-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-fg">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
