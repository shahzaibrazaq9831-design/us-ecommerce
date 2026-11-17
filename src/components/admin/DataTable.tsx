"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState } from "./Feedback";

export interface DataColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right";
  hideOnMobile?: boolean;
}

export default function DataTable<T extends { id: string | number }>({
  rows,
  columns,
  rowKey,
  onRowClick,
  initialSort,
  emptyTitle = "Nothing here yet",
  emptyDescription = "New records will appear here as soon as they exist.",
  compact = false,
}: {
  rows: T[];
  columns: DataColumn<T>[];
  rowKey?: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  initialSort?: { key: string; direction: "asc" | "desc" };
  emptyTitle?: string;
  emptyDescription?: string;
  compact?: boolean;
}) {
  const [sort, setSort] = useState(initialSort ?? null);
  const reduce = useReducedMotion();

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((item) => item.key === sort.key);
    if (!column?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);
      const comparison =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [rows, sort, columns]);

  function toggleSort(key: string) {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "asc" };
      return { key, direction: current.direction === "asc" ? "desc" : "asc" };
    });
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <div className="admin-table-wrap">
        <table className={`admin-table ${compact ? "admin-table--compact" : ""}`}>
          <thead>
            <tr>
              {columns.map((column) => {
                const sortable = Boolean(column.sortValue);
                const active = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={column.align === "right" ? "is-right" : undefined}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className="admin-sort-button"
                        onClick={() => toggleSort(column.key)}
                        aria-label={`Sort by ${column.header}`}
                      >
                        {column.header}
                        {active ? (
                          sort?.direction === "asc" ? (
                            <ArrowUp size={13} />
                          ) : (
                            <ArrowDown size={13} />
                          )
                        ) : (
                          <ChevronsUpDown size={13} />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, index) => (
              <motion.tr
                key={rowKey ? rowKey(row) : row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(event) => {
                  if (onRowClick && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onRowClick(row);
                  }
                }}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : Math.min(index * 0.025, 0.25) }}
                className={onRowClick ? "is-clickable" : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.align === "right" ? "is-right" : undefined}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-mobile-cards">
        {sorted.map((row) => (
          <button
            type="button"
            className="admin-mobile-card"
            key={rowKey ? rowKey(row) : row.id}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {columns
              .filter((column) => !column.hideOnMobile)
              .map((column) => (
                <div className="admin-mobile-card-row" key={column.key}>
                  <span>{column.header}</span>
                  <div>{column.render(row)}</div>
                </div>
              ))}
          </button>
        ))}
      </div>
    </>
  );
}
