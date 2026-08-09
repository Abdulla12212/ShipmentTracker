import { statusLabel } from "@/lib/format";
import { statusTone } from "@/lib/status";
import type { ShipmentStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

export function StatusPill({ status }: { status: ShipmentStatus }) {
  return <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>;
}
