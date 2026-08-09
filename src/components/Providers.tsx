"use client";

import { ShipmentProvider } from "@/lib/store/ShipmentProvider";
import { ToastViewport } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ShipmentProvider>
      {children}
      <ToastViewport />
    </ShipmentProvider>
  );
}
