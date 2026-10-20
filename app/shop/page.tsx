"use client";

import { useMemo, useState } from "react";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";

const categories = ["All", "Bridal", "Wedding", "Formals", "Chiffon", "Mehndi", "Nikkah", "Eid"];
const priceRanges = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under $100", min: 0, max: 100 },
  { label: "$100 - $149", min: 100, max: 150 },
  { label: "$150 - $249", min: 150, max: 250 },
  { label: "$250+", min: 250, max: Infinity },
];

export default function ShopPage() {
  const [category, setCategory] = useState("All");
  const [price, setPrice] = useState("All Prices");
  const [sort, setSort] = useState("featured");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let items = [...products];
    const range = priceRanges.find((r) => r.label === price) || priceRanges[0];

    if (category !== "All") {
      items = items.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    items = items.filter((p) => p.price >= range.min && p.price < range.max);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }

    if (sort === "price-asc") items.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") items.sort((a, b) => b.price - a.price);
    if (sort === "newest") items = items.filter((p) => p.badge === "new").concat(items.filter((p) => p.badge !== "new"));
    if (sort === "bestseller") items = items.filter((p) => p.badge === "bestseller").concat(items.filter((p) => p.badge !== "bestseller"));

    return items;
  }, [category, price, sort, search]);

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h1 className="section-title">Shop All</h1>
            <p className="section-subtitle">Explore our complete collection of premium Pakistani dresses</p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "24px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "10px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)", minWidth: "240px" }}
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: "10px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select value={price} onChange={(e) => setPrice(e.target.value)} style={{ padding: "10px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }}>
              {priceRanges.map((r) => (
                <option key={r.label} value={r.label}>
                  {r.label}
                </option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: "10px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }}>
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="bestseller">Best Sellers</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <div style={{ marginLeft: "auto", color: "var(--color-gray-600)" }}>
              {filtered.length} {filtered.length === 1 ? "product" : "products"}
            </div>
          </div>

          <Reveal>
            <div className="products-grid">
              {filtered.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </Reveal>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-gray-600)" }}>
              No products match your filters. Try adjusting your search.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
