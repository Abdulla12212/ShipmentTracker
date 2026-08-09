"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { DAY_MS, NOW } from "@/lib/constants";
import { formatPercent } from "@/lib/format";
import { EXCEPTION_REASONS } from "@/lib/seed/reference";
import { useDataset } from "@/lib/store/ShipmentProvider";
import { computeAnalytics } from "@/lib/store/selectors";

const RANGES = [
  { id: "30", label: "Last 30 days", days: 30 },
  { id: "60", label: "Last 60 days", days: 60 },
  { id: "90", label: "Last 90 days", days: 90 },
] as const;

const COLORS = [
  "var(--accent)",
  "var(--info)",
  "var(--violet)",
  "var(--warning)",
  "var(--success)",
  "var(--danger)",
  "var(--muted)",
];

export default function AnalyticsPage() {
  const dataset = useDataset();
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("90");
  const days = RANGES.find((r) => r.id === range)?.days ?? 90;
  const analytics = useMemo(
    () => computeAnalytics(dataset, NOW - days * DAY_MS, NOW),
    [dataset, days],
  );

  const exceptionPie = analytics.exceptionBreakdown.map((row) => ({
    name: EXCEPTION_REASONS[row.reason as keyof typeof EXCEPTION_REASONS]?.label ?? row.reason,
    value: row.count,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Analytics</h1>
          <p className="mt-1 text-sm text-muted">
            Performance across carriers, lanes, and exception reasons.
          </p>
        </div>
        <Select
          className="w-full md:w-48"
          value={range}
          onChange={(e) => setRange(e.target.value as typeof range)}
        >
          {RANGES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="On-time performance" subtitle="Trend over selected range" />
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={analytics.onTimeTrend}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: "var(--subtle)", fontSize: 11 }} />
                <YAxis
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                  domain={[0, 1]}
                  tick={{ fill: "var(--subtle)", fontSize: 11 }}
                  width={42}
                />
                <Tooltip
                  formatter={(value) => formatPercent(Number(value), 1)}
                  contentStyle={tooltipStyle}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Volume by lane" subtitle="Top 10 origin → destination" />
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={analytics.lanes} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: "var(--subtle)", fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="lane"
                  width={88}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--info)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Carrier scorecard" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-subtle">
                <tr className="border-b border-border">
                  <th className="px-2 py-2 font-medium">Carrier</th>
                  <th className="px-2 py-2 font-medium">Volume</th>
                  <th className="px-2 py-2 font-medium">On-time</th>
                  <th className="px-2 py-2 font-medium">Avg delay</th>
                  <th className="px-2 py-2 font-medium">Cost / kg</th>
                  <th className="px-2 py-2 font-medium">Exception rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.carriers.map((c) => (
                  <tr key={c.id} className="border-b border-border/70">
                    <td className="px-2 py-2.5 font-medium text-fg">{c.name}</td>
                    <td className="tnum px-2 py-2.5">{c.volume}</td>
                    <td className="tnum px-2 py-2.5">{formatPercent(c.onTime, 1)}</td>
                    <td className="tnum px-2 py-2.5">{c.avgDelayHours.toFixed(1)}h</td>
                    <td className="tnum px-2 py-2.5">${c.costPerKg.toFixed(2)}</td>
                    <td className="tnum px-2 py-2.5">{formatPercent(c.exceptionRate, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Delivery time distribution" />
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={analytics.deliveryHistogram}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={{ fill: "var(--subtle)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--subtle)", fontSize: 11 }} width={32} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--violet)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Exception reasons" />
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={exceptionPie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={84}
                  paddingAngle={2}
                >
                  {exceptionPie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {exceptionPie.map((row, i) => (
              <li key={row.name} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  {row.name}
                </span>
                <span className="tnum text-fg">{row.value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};
