"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";

interface SearchResult {
  title: string;
  subtitle: string;
  href: string;
  type: string;
}

const QUICK_LINKS: SearchResult[] = [
  { title: "Overview", subtitle: "Revenue and performance", href: "/admin", type: "Page" },
  { title: "Orders", subtitle: "Search and manage orders", href: "/admin/orders", type: "Page" },
  { title: "Products", subtitle: "Catalogue and stock", href: "/admin/products", type: "Page" },
  { title: "Categories", subtitle: "Shop categories", href: "/admin/categories", type: "Page" },
  { title: "Brands", subtitle: "Designers and occasions", href: "/admin/brands", type: "Page" },
  { title: "Customers", subtitle: "Customer history", href: "/admin/customers", type: "Page" },
  { title: "Reviews", subtitle: "Moderate customer reviews", href: "/admin/reviews", type: "Page" },
  { title: "Analytics", subtitle: "Trends and breakdowns", href: "/admin/analytics", type: "Page" },
  { title: "Settings", subtitle: "Store details", href: "/admin/settings", type: "Page" },
];

export default function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const reduce = useReducedMotion();
  const needle = query.trim().toLowerCase();
  const remote = needle.length >= 2;

  const quickResults = useMemo(
    () => QUICK_LINKS.filter((item) => item.title.toLowerCase().includes(needle)).slice(0, 9),
    [needle]
  );
  const results = remote ? remoteResults : quickResults;

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (open || (!query && !remoteResults.length && !active && !loading)) return;
    queueMicrotask(() => {
      setQuery("");
      setRemoteResults([]);
      setActive(0);
      setLoading(false);
    });
  }, [open, query, remoteResults.length, active, loading]);

  useEffect(() => {
    if (!open || !remote) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { results: SearchResult[] };
        setRemoteResults(data.results);
        setActive(0);
      } catch {
        // An aborted search simply keeps the previous results.
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, remote]);

  function select(result: SearchResult) {
    onClose();
    router.push(result.href);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="admin-modal-overlay"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search the admin area"
            className="admin-command"
            initial={reduce ? false : { opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 34 }}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((current) => Math.min(current + 1, results.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((current) => Math.max(current - 1, 0));
              }
              if (event.key === "Enter" && results[active]) {
                event.preventDefault();
                select(results[active]);
              }
            }}
          >
            <div className="admin-command-input-row">
              <Search size={19} aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search orders, products, customers…"
                aria-label="Search"
              />
              <button
                type="button"
                className="admin-icon-button"
                onClick={onClose}
                aria-label="Close search"
              >
                <X size={17} />
              </button>
            </div>

            <div className="admin-command-results">
              {remote && loading ? (
                <p className="admin-command-hint">Searching…</p>
              ) : results.length === 0 ? (
                <div className="admin-command-empty">
                  <p>No matches found.</p>
                  <span>Try an order number, product name or customer email.</span>
                </div>
              ) : (
                results.map((result, index) => (
                  <button
                    type="button"
                    key={`${result.type}-${result.title}-${index}`}
                    className={`admin-command-result ${index === active ? "is-active" : ""}`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => select(result)}
                  >
                    <span className="admin-command-type">{result.type}</span>
                    <span className="admin-command-copy">
                      <strong>{result.title}</strong>
                      <small>{result.subtitle}</small>
                    </span>
                  </button>
                ))
              )}
            </div>
            <footer className="admin-command-footer">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd> to navigate
              </span>
              <span>
                <kbd>↵</kbd> to open
              </span>
              <span>
                <kbd>esc</kbd> to close
              </span>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
