"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cx } from "@/lib/format";
import { useDispatch, useStore } from "@/lib/store/ShipmentProvider";

const toneBorder = {
  info: "border-info/40",
  success: "border-success/40",
  warning: "border-warning/40",
  danger: "border-danger/40",
} as const;

export function ToastViewport() {
  const { state } = useStore();
  const dispatch = useDispatch();

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      <AnimatePresence>
        {state.toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            title={toast.title}
            body={toast.body}
            tone={toast.tone}
            onDismiss={() => dispatch({ type: "DISMISS_TOAST", id: toast.id })}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  id,
  title,
  body,
  tone,
  onDismiss,
}: {
  id: string;
  title: string;
  body: string;
  tone: keyof typeof toneBorder;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      className={cx(
        "pointer-events-auto panel flex items-start gap-3 border p-3",
        toneBorder[tone],
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted">{body}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="rounded-md p-1 text-subtle hover:bg-surface-3 hover:text-fg"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
