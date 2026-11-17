"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Inbox, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`admin-skeleton ${className}`} aria-hidden="true" />;
}

export function LoadingGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="admin-stat-grid" aria-label="Loading dashboard">
      {Array.from({ length: count }).map((_, index) => (
        <div className="admin-stat-card is-loading" key={index}>
          <Skeleton className="skeleton-label" />
          <Skeleton className="skeleton-value" />
          <Skeleton className="skeleton-hint" />
        </div>
      ))}
    </div>
  );
}

export function LoadingTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="admin-table-loading" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="admin-table-loading-row" key={index}>
          <Skeleton className="skeleton-cell" />
          <Skeleton className="skeleton-cell" />
          <Skeleton className="skeleton-cell" />
          <Skeleton className="skeleton-cell" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="admin-empty-state"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.3 }}
    >
      <span className="admin-empty-icon" aria-hidden="true">
        {icon ?? <Inbox size={26} />}
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </motion.div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="admin-error-state" role="alert">
      <TriangleAlert size={24} aria-hidden="true" />
      <div>
        <strong>Something went wrong</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
