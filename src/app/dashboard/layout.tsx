import { OpsShell } from "@/components/layout/OpsShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <OpsShell>{children}</OpsShell>;
}
