"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import CountUp from "./CountUp";

export interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  hint?: string;
  tone?: "gold" | "green" | "blue" | "rose";
  format?: (value: number) => string;
}

export default function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "green",
  format,
}: StatCardProps) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      className={`admin-stat-card admin-stat-card--${tone}`}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
    >
      <div className="admin-stat-top">
        <span className="admin-stat-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="admin-stat-label">{label}</span>
      </div>
      <strong className="admin-stat-value">
        <CountUp value={value} format={format} />
      </strong>
      {hint ? <span className="admin-stat-hint">{hint}</span> : null}
    </motion.article>
  );
}
