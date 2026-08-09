import { cx } from "@/lib/format";

const variants = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-strong border-transparent shadow-[0_0_0_1px_rgba(34,211,238,0.25)]",
  secondary:
    "bg-surface-2 text-fg border-border hover:border-border-strong hover:bg-surface-3",
  ghost: "bg-transparent text-muted border-transparent hover:bg-surface-2 hover:text-fg",
  danger: "bg-danger/15 text-danger border-danger/30 hover:bg-danger/25",
} as const;

const sizes = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-10 px-3.5 text-sm",
  lg: "h-12 px-5 text-sm",
} as const;

export function Button({
  children,
  className,
  variant = "secondary",
  size = "md",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
