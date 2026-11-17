"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion, useReducedMotion } from "framer-motion";
import ChartCard from "./ChartCard";
import type { NamedValue, RevenuePoint } from "@/lib/admin/types";
import { formatMoney } from "@/lib/admin/format";

const GOLD = "#c9a227";
const GREEN = "#0f6b52";
const PALETTE = ["#0f6b52", "#c9a227", "#3f8f77", "#e0b84c", "#185c47", "#8c6d1f", "#6aa48f", "#b9b0a0"];

function axisStyle(): { fill: string; fontSize: number } {
  return { fill: "var(--admin-text-muted)", fontSize: 11 };
}

export function RevenueAreaChart({ data }: { data: RevenuePoint[] }) {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const reduce = useReducedMotion();
  const visible = data.slice(-days);

  return (
    <ChartCard
      title="Revenue over time"
      subtitle="Paid orders only · cancelled and refunded excluded"
      action={
        <div className="admin-segmented" role="group" aria-label="Revenue period">
          {([7, 30, 90] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={days === value ? "is-active" : ""}
              onClick={() => setDays(value)}
              aria-pressed={days === value}
            >
              {value}d
            </button>
          ))}
        </div>
      }
    >
      {visible.some((point) => point.revenue > 0) ? (
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="admin-chart-canvas"
        >
          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={visible} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.38} />
                  <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 4" stroke="var(--admin-border)" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle()} axisLine={false} tickLine={false} minTickGap={28} />
              <YAxis
                tick={axisStyle()}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--admin-surface-raised)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 12,
                  color: "var(--admin-text)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--admin-text-muted)" }}
                formatter={(value) => [formatMoney(Number(value ?? 0)), "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={GOLD}
                strokeWidth={2.5}
                fill="url(#adminRevenueFill)"
                isAnimationActive={!reduce}
                animationDuration={1000}
                activeDot={{ r: 5, fill: GOLD, stroke: "var(--admin-surface)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      ) : (
        <div className="admin-chart-empty">
          <p>No paid orders in this period yet.</p>
          <span>Revenue appears here as soon as a payment is recorded.</span>
        </div>
      )}
    </ChartCard>
  );
}

export function StatusDonut({ data }: { data: NamedValue[] }) {
  const reduce = useReducedMotion();

  return (
    <ChartCard title="Orders by status" subtitle="Live workshop pipeline">
      {data.length ? (
        <div className="admin-donut-wrap">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={3}
                stroke="none"
                isAnimationActive={!reduce}
                animationDuration={900}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--admin-surface-raised)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="admin-donut-legend">
            {data.map((entry, index) => (
              <li key={entry.name}>
                <span style={{ background: PALETTE[index % PALETTE.length] }} aria-hidden="true" />
                <span>{entry.name.replace(/_/g, " ")}</span>
                <strong>{entry.value}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="admin-chart-empty">
          <p>No orders to group yet.</p>
        </div>
      )}
    </ChartCard>
  );
}

export function RankingBar({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: NamedValue[];
}) {
  const reduce = useReducedMotion();

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {data.length ? (
        <div className="admin-chart-canvas">
          <ResponsiveContainer width="100%" height={Math.max(200, data.length * 38)}>
            <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 18 }}>
              <CartesianGrid strokeDasharray="3 4" stroke="var(--admin-border)" horizontal={false} />
              <XAxis
                type="number"
                tick={axisStyle()}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ ...axisStyle(), fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--admin-surface-hover)" }}
                contentStyle={{
                  background: "var(--admin-surface-raised)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value) => [formatMoney(Number(value ?? 0)), "Revenue"]}
              />
              <Bar
                dataKey="value"
                fill={GREEN}
                radius={[0, 6, 6, 0]}
                barSize={16}
                isAnimationActive={!reduce}
                animationDuration={900}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="admin-chart-empty">
          <p>No paid order lines to rank yet.</p>
        </div>
      )}
    </ChartCard>
  );
}

export function CountBar({
  title,
  subtitle,
  data,
  color = GREEN,
}: {
  title: string;
  subtitle?: string;
  data: NamedValue[];
  color?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {data.length ? (
        <div className="admin-chart-canvas">
          <ResponsiveContainer width="100%" height={Math.max(190, data.length * 36)}>
            <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 18 }}>
              <CartesianGrid strokeDasharray="3 4" stroke="var(--admin-border)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={axisStyle()} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ ...axisStyle(), fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--admin-surface-hover)" }}
                contentStyle={{
                  background: "var(--admin-surface-raised)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="value"
                fill={color}
                radius={[0, 6, 6, 0]}
                barSize={16}
                isAnimationActive={!reduce}
                animationDuration={900}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="admin-chart-empty">
          <p>Nothing to show yet.</p>
        </div>
      )}
    </ChartCard>
  );
}
