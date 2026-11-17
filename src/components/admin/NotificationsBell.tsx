"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, ShoppingCart, TriangleAlert } from "lucide-react";

interface NotificationData {
  lowStock: { id: number; name: string; stock: number }[];
  newOrders: { id: string; customer: string; date: string }[];
  counts: { lowStock: number; newOrders: number };
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (response.ok) setData((await response.json()) as NotificationData);
    } catch {
      // The bell simply stays empty when the request fails.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [load]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const total = (data?.counts.lowStock ?? 0) + (data?.counts.newOrders ?? 0);

  return (
    <div className="admin-notifications" ref={wrapper}>
      <motion.button
        type="button"
        className="admin-icon-button admin-bell"
        onClick={() => setOpen((value) => !value)}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        aria-label={`Notifications${total ? `, ${total} alerts` : ""}`}
        aria-expanded={open}
      >
        <Bell size={18} />
        {total > 0 ? (
          <motion.span
            className="admin-bell-badge"
            initial={reduce ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            key={total}
          >
            {total > 9 ? "9+" : total}
          </motion.span>
        ) : null}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="admin-popover admin-notifications-panel"
            initial={reduce ? false : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            <header className="admin-popover-head">
              <strong>Notifications</strong>
              <button type="button" onClick={() => void load()} className="admin-link-button">
                {loading ? "Refreshing…" : "Refresh"}
              </button>
            </header>

            <div className="admin-notification-list">
              {data?.newOrders.map((order) => (
                <Link
                  href={`/admin/orders?order=${encodeURIComponent(order.id)}`}
                  key={order.id}
                  className="admin-notification"
                  onClick={() => setOpen(false)}
                >
                  <span className="admin-notification-icon is-order">
                    <ShoppingCart size={16} />
                  </span>
                  <span>
                    <strong>New order {order.id}</strong>
                    <small>{order.customer} is waiting for confirmation</small>
                  </span>
                </Link>
              ))}

              {data?.lowStock.map((product) => (
                <Link
                  href={`/admin/products?product=${product.id}`}
                  key={product.id}
                  className="admin-notification"
                  onClick={() => setOpen(false)}
                >
                  <span className="admin-notification-icon is-stock">
                    <TriangleAlert size={16} />
                  </span>
                  <span>
                    <strong>Low stock: {product.name}</strong>
                    <small>{product.stock} units left</small>
                  </span>
                </Link>
              ))}

              {!loading && total === 0 ? (
                <div className="admin-notification-empty">
                  <p>Everything is up to date.</p>
                  <span>New orders and low stock will appear here.</span>
                </div>
              ) : null}

              {loading && !data ? (
                <div className="admin-notification-empty">
                  <p>Loading notifications…</p>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
