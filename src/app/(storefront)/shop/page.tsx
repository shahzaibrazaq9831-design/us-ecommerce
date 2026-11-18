"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { categories, occasions, products, searchProducts, type OccasionSlug } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { useProductRatings } from "@/components/ProductRatingsProvider";
import { useCurrency } from "@/context/CurrencyContext";

/**
 * Price bands are held in the store's base currency (PKR) and shown to the
 * visitor in whatever currency they are browsing in.
 */
const priceRanges = [
  { id: "all", label: "All Prices", min: 0, max: Infinity },
  { id: "under-60", label: "Under 60,000", min: 0, max: 60000 },
  { id: "60-75", label: "60,000 – 75,000", min: 60000, max: 75000 },
  { id: "75-90", label: "75,000 – 90,000", min: 75000, max: 90000 },
  { id: "over-90", label: "90,000 and above", min: 90000, max: Infinity },
];

/**
 * Reads the query string without a hydration mismatch: the server snapshot is
 * empty, the client snapshot is the real URL, so React swaps the value in
 * right after hydration.
 */
const subscribeToLocation = () => () => {};
const getLocationSearch = () => window.location.search;
const getServerLocationSearch = () => "";

export default function ShopPage() {
  const { formatPrice } = useCurrency();
  const ratings = useProductRatings();
  const [category, setCategory] = useState("all");
  const [occasion, setOccasion] = useState("all");
  const [price, setPrice] = useState("all");
  const [sort, setSort] = useState("featured");
  const [search, setSearch] = useState("");
  const locationSearch = useSyncExternalStore(
    subscribeToLocation,
    getLocationSearch,
    getServerLocationSearch
  );
  const [seenSearch, setSeenSearch] = useState<string | null>(null);

  // The mobile drawer links to /shop?q=... — pick the term up from the URL.
  // Adjusting state during render (instead of in an effect) keeps this free of
  // cascading renders and of hydration mismatches.
  if (seenSearch === null) {
    setSeenSearch(locationSearch);
  } else if (seenSearch !== locationSearch) {
    setSeenSearch(locationSearch);
    setSearch(new URLSearchParams(locationSearch).get("q") ?? "");
  }

  const filtered = useMemo(() => {
    let items = [...products];
    const range = priceRanges.find((r) => r.id === price) ?? priceRanges[0];

    if (category !== "all") {
      items = items.filter((p) => p.category === category);
    }
    if (occasion !== "all") {
      items = items.filter((p) => p.occasions.includes(occasion as OccasionSlug));
    }
    items = items.filter((p) => p.price >= range.min && p.price < range.max);
    if (search.trim()) {
      const wanted = new Set(searchProducts(search).map((p) => p.slug));
      items = items.filter((p) => wanted.has(p.slug));
    }

    if (sort === "price-asc") items.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") items.sort((b, a) => b.price - a.price);
    if (sort === "newest") items = items.filter((p) => p.isNew).concat(items.filter((p) => !p.isNew));
    if (sort === "bestseller")
      items = items.filter((p) => p.isBestSeller).concat(items.filter((p) => !p.isBestSeller));
    if (sort === "rating")
      // "Top rated" uses the real rating from the approved reviews — a
      // piece nobody has reviewed yet has no rating and sorts last.
      items.sort(
        (a, b) =>
          (ratings[b.slug]?.average ?? 0) - (ratings[a.slug]?.average ?? 0) ||
          (ratings[b.slug]?.count ?? 0) - (ratings[a.slug]?.count ?? 0)
      );

    return items;
  }, [category, occasion, price, sort, search, ratings]);

  const activeRange = priceRanges.find((r) => r.id === price) ?? priceRanges[0];

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-header listing-header">
            <h1 className="section-title">Shop All</h1>
            <p className="section-subtitle">
              Every piece in the catalogue — bridal, wedding, formal and chiffon — all
              available unstitched, standard or made to your measurements.
            </p>
          </div>

          <div className="shop-toolbar">
            <label className="shop-search">
              <span className="sr-only">Search the catalogue</span>
              <input
                type="search"
                placeholder="Search by name or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <label className="shop-select">
              <span className="sr-only">Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="shop-select">
              <span className="sr-only">Occasion</span>
              <select value={occasion} onChange={(e) => setOccasion(e.target.value)}>
                <option value="all">All occasions</option>
                {occasions.map((o) => (
                  <option key={o.slug} value={o.slug}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="shop-select">
              <span className="sr-only">Price</span>
              <select value={price} onChange={(e) => setPrice(e.target.value)}>
                {priceRanges.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id === "all"
                      ? r.label
                      : `${r.label} ${formatPrice(r.min)}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="shop-select">
              <span className="sr-only">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="bestseller">Best Sellers</option>
                <option value="rating">Top rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </label>

            <p className="shop-count" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "product" : "products"}
            </p>
          </div>

          <Reveal>
            <div className="products-grid">
              {filtered.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </Reveal>

          {filtered.length === 0 && (
            <div className="listing-empty" role="status">
              No products match your filters. Try widening the price range or clearing
              the search.
              {activeRange.id !== "all" ? ` Currently showing ${activeRange.label}.` : ""}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
