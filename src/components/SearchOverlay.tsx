"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { products, formatPrice } from "@/data/products";

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => {
        const input = document.getElementById("site-search-input") as HTMLInputElement | null;
        input?.focus();
      }, 50);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query]);

  if (!open) return null;

  return (
    <>
      <div className="search-bar active">
        <div className="search-container">
          <i className="fas fa-search" style={{ color: "var(--color-gray-400)" }} />
          <input
            id="site-search-input"
            type="text"
            placeholder="Search dresses, collections..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="search-close" onClick={onClose} aria-label="Close search">
            <i className="fas fa-times" />
          </button>
        </div>
        {query.trim() && (
          <div style={{ maxWidth: "700px", margin: "16px auto 0", background: "var(--color-white)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
            {results.length === 0 ? (
              <div style={{ padding: "16px", color: "var(--color-gray-600)" }}>No results found</div>
            ) : (
              <ul>
                {results.map((p) => (
                  <li key={p.slug} style={{ borderBottom: "1px solid var(--color-gray-100)" }}>
                    <Link
                      href={`/products/${p.slug}`}
                      onClick={onClose}
                      style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px" }}
                    >
                      <div style={{ position: "relative", width: "60px", height: "80px", flex: "0 0 auto" }}>
                        <Image src={p.image} alt={p.name} fill sizes="60px" style={{ objectFit: "cover" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ color: "var(--color-gray-600)", fontSize: "0.9rem" }}>{p.category} • {formatPrice(p.price)}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="overlay active" onClick={onClose} />
    </>
  );
}
