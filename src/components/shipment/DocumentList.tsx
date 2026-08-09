import { FileText } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { ShipmentDocument } from "@/lib/types";

export function DocumentList({ documents }: { documents: ShipmentDocument[] }) {
  return (
    <ul className="divide-y divide-border">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center gap-3 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-accent">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{doc.name}</p>
            <p className="text-xs text-muted">
              {doc.type} · {doc.sizeKb} KB · {formatDate(doc.issuedAt)}
            </p>
          </div>
          <span className="text-xs text-subtle">View</span>
        </li>
      ))}
    </ul>
  );
}
