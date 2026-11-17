"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ADMIN_ORDER_STATUS_LABELS,
  STATUS_TONES,
  normaliseAdminOrderStatus,
} from "@/lib/admin/status";

export default function StatusBadge({ status }: { status: string }) {
  const value = normaliseAdminOrderStatus(status);
  const reduce = useReducedMotion();

  return (
    <motion.span
      className={`admin-status-badge admin-status-badge--${STATUS_TONES[value]}`}
      initial={reduce ? false : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <span className="admin-status-dot" aria-hidden="true" />
      {ADMIN_ORDER_STATUS_LABELS[value]}
    </motion.span>
  );
}
