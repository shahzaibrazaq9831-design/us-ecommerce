"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { searchProducts } from "@/lib/products";
import Price from "@/components/Price";
import { useCatalogProducts } from "@/components/StoreCatalogProvider";

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const catalog = useCatalogProducts();

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      setQuery("");
      const input = document.getElementById("site-search-input") as HTMLInputElement | null;
      input?.focus();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    // Searches the catalogue by product name, category, occasion and designer.
    return searchProducts(q, catalog).slice(0, 8);
  }, [query, catalog]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[2000] bg-white px-[var(--container-padding)] py-[var(--spacing-xl)] shadow-[var(--shadow-lg)]">
        <div className="mx-auto flex max-w-[700px] items-center gap-[var(--spacing-md)] border-b-2 border-[var(--color-gray-300)] pb-[var(--spacing-sm)]">
          <i className="fas fa-search" style={{ color: "var(--color-gray-400)" }} />
          <input
            id="site-search-input"
            type="text"
            placeholder="Search by dress, category or designer..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-[1.1rem] text-secondary placeholder:text-[var(--color-gray-400)]"
          />
          <button
            className="p-[var(--spacing-sm)] text-[1.25rem] text-[var(--color-gray-500)]"
            onClick={onClose}
            aria-label="Close search"
          >
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
                        <div style={{ color: "var(--color-gray-600)", fontSize: "0.9rem" }}>
                          {p.categoryLabel} •{" "}
                          <Price
                            value={p.price}
                            compareAt={p.originalPrice}
                            className=""
                            valueClassName=""
                            compareAtClassName="price-original"
                            style={{ display: "inline-flex", gap: "6px" }}
                          />
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="fixed inset-0 z-[1500] bg-[rgba(0,0,0,0.5)]" onClick={onClose} />
    </>
  );
}
