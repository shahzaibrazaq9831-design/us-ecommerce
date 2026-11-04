"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Grid2x2,
  Grid3x3,
  SlidersHorizontal,
  X,
} from "lucide-react";
import CollectionProductCard from "@/components/CollectionProductCard";
import {
  NEW_ARRIVALS_COUNT,
  newArrivalsCatalog,
  type Availability,
} from "@/data/newArrivals";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "most-relevant", label: "Most relevant" },
  { value: "best-selling", label: "Best selling" },
  { value: "az", label: "Alphabetically, A-Z" },
  { value: "za", label: "Alphabetically, Z-A" },
  { value: "price-ascending", label: "Price, low to high" },
  { value: "price-descending", label: "Price, high to low" },
  { value: "created-ascending", label: "Date, old to new" },
  { value: "created-descending", label: "Date, new to old" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];
type GridMode = "default" | "compact";

const AVAILABILITY_OPTIONS: { value: Availability; label: string }[] = [
  { value: "in_stock", label: "In stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

const DEFAULT_AVAILABILITY: Availability[] = ["in_stock", "out_of_stock"];

const VALID_SORTS = new Set<string>(SORT_OPTIONS.map((option) => option.value));

const sortOptionsByValue = new Map<string, SortValue>(
  SORT_OPTIONS.map((option) => [option.value, option.value])
);

const parseQuery = (search: string) => {
  const params = new URLSearchParams(search);
  const rawSort = params.get("sort_by");
  const sort: SortValue =
    rawSort && VALID_SORTS.has(rawSort) ? (sortOptionsByValue.get(rawSort) as SortValue) : "featured";
  const grid: GridMode = params.get("grid") === "compact" ? "compact" : "default";

  const rawAvailability = params.get("availability");
  const availability = rawAvailability
    ? (rawAvailability
        .split(",")
        .map((part) => part.trim())
        .filter((part): part is Availability =>
          AVAILABILITY_OPTIONS.some((option) => option.value === part)
        ) as Availability[])
    : DEFAULT_AVAILABILITY;

  return { sort, grid, availability: availability.length ? availability : DEFAULT_AVAILABILITY };
};

const buildQuery = (
  sort: SortValue,
  availability: Availability[],
  grid: GridMode
): string => {
  const params = new URLSearchParams();
  // Keep the reference storefront's parameter names so old shared links work.
  if (sort !== "featured") params.set("sort_by", sort);
  if (availability.length !== AVAILABILITY_OPTIONS.length) {
    params.set("availability", [...availability].sort().join(","));
  }
  if (grid !== "default") params.set("grid", grid);
  const query = params.toString();
  return query ? `?${query}` : "";
};

export default function NewArrivalsView() {
  const [sort, setSort] = useState<SortValue>("featured");
  const [grid, setGrid] = useState<GridMode>("default");
  const [availability, setAvailability] = useState<Availability[]>(DEFAULT_AVAILABILITY);
  const [openMenu, setOpenMenu] = useState<"availability" | "sort" | null>(null);

  // Seed the controls from the URL on mount (client-only) and keep them in sync
  // with browser back/forward navigation.
  useEffect(() => {
    const applyFromLocation = () => {
      const query = parseQuery(window.location.search);
      setSort(query.sort);
      setGrid(query.grid);
      setAvailability(query.availability);
    };
    applyFromLocation();
    window.addEventListener("popstate", applyFromLocation);
    return () => window.removeEventListener("popstate", applyFromLocation);
  }, []);

  // Reflect the current controls in the URL without adding history entries.
  useEffect(() => {
    const next = `${window.location.pathname}${buildQuery(sort, availability, grid)}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (next !== current) {
      window.history.replaceState(null, "", next);
    }
  }, [sort, availability, grid]);

  // Close any open menu on outside click or Escape.
  useEffect(() => {
    if (openMenu === null) return;
    const onPointerDown = (event: PointerEvent) => {
      const host = event.target as HTMLElement | null;
      if (host?.closest(".collection-toolbar-menu")) return;
      setOpenMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  const toggleAvailability = useCallback((value: Availability) => {
    setAvailability((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setAvailability(DEFAULT_AVAILABILITY);
    setSort("featured");
  }, []);

  const visible = useMemo(() => {
    const items = newArrivalsCatalog.filter((item) => availability.includes(item.availability));
    switch (sort) {
      case "most-relevant":
        return [...items].sort((a, b) => a.relevanceRank - b.relevanceRank);
      case "best-selling":
        return [...items].sort((a, b) => a.bestSellingRank - b.bestSellingRank);
      case "az":
        return [...items].sort((a, b) => a.name.localeCompare(b.name));
      case "za":
        return [...items].sort((a, b) => b.name.localeCompare(a.name));
      case "price-ascending":
        return [...items].sort((a, b) => a.price - b.price);
      case "price-descending":
        return [...items].sort((a, b) => b.price - a.price);
      case "created-ascending":
        return [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      case "created-descending":
        return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case "featured":
      default:
        return items;
    }
  }, [availability, sort]);

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (availability.length !== AVAILABILITY_OPTIONS.length) {
    for (const value of availability) {
      const option = AVAILABILITY_OPTIONS.find((item) => item.value === value);
      if (option) {
        activeChips.push({
          key: `availability-${value}`,
          label: `Availability: ${option.label}`,
          onRemove: () => toggleAvailability(value),
        });
      }
    }
  }
  if (sort !== "featured") {
    const option = SORT_OPTIONS.find((item) => item.value === sort);
    if (option) {
      activeChips.push({
        key: "sort",
        label: `Sort: ${option.label}`,
        onRemove: () => setSort("featured"),
      });
    }
  }

  return (
    <section className="collection-page" aria-labelledby="new-arrivals-heading">
      <div className="container">
        <header className="collection-header">
          <p className="collection-eyebrow"></p>
          <h1 id="new-arrivals-heading" className="collection-title">
            New Arrivals
          </h1>
          <p className="collection-subtitle">
            {NEW_ARRIVALS_COUNT} designer-inspired ensembles, added weekly. Filter by
            availability or sort the collection below.
          </p>
        </header>

        {/* Toolbar — availability filter left, count / sort / grid density right. */}
        <div className="collection-toolbar" aria-label="Collection controls">
          <div className="collection-toolbar-menu">
            <button
              type="button"
              className={`collection-pill${openMenu === "availability" ? " is-open" : ""}`}
              aria-expanded={openMenu === "availability"}
              aria-controls="availability-menu"
              onClick={() =>
                setOpenMenu((current) => (current === "availability" ? null : "availability"))
              }
            >
              <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
              Availability
              <ChevronDown
                size={16}
                strokeWidth={1.75}
                aria-hidden="true"
                className="collection-pill-chevron"
              />
            </button>
            {openMenu === "availability" && (
              <div id="availability-menu" className="collection-menu" role="group" aria-label="Availability">
                <p className="collection-menu-title">Availability</p>
                <div className="collection-menu-actions">
                  <button type="button" className="collection-menu-clear" onClick={() => setAvailability([])}>
                    Clear
                  </button>
                  <button
                    type="button"
                    className="collection-menu-clear"
                    onClick={() => setAvailability(DEFAULT_AVAILABILITY)}
                  >
                    Select all
                  </button>
                </div>
                {AVAILABILITY_OPTIONS.map((option) => {
                  const checked = availability.includes(option.value);
                  return (
                    <label key={option.value} className="collection-checkbox">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAvailability(option.value)}
                      />
                      <span className="collection-checkbox-box" aria-hidden="true">
                        {checked && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="collection-toolbar-right">
            <span className="collection-count" aria-live="polite">
              {visible.length} {visible.length === 1 ? "item" : "items"}
            </span>

            <div className="collection-toolbar-menu">
              <button
                type="button"
                className={`collection-pill${openMenu === "sort" ? " is-open" : ""}`}
                aria-expanded={openMenu === "sort"}
                aria-controls="sort-menu"
                onClick={() => setOpenMenu((current) => (current === "sort" ? null : "sort"))}
              >
                Sort
                <ChevronDown
                  size={16}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="collection-pill-chevron"
                />
              </button>
              {openMenu === "sort" && (
                <div id="sort-menu" className="collection-menu collection-menu--right" role="listbox" aria-label="Sort products">
                  <p className="collection-menu-title">Sort by</p>
                  {SORT_OPTIONS.map((option) => {
                    const selected = option.value === sort;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={`collection-sort-option${selected ? " is-selected" : ""}`}
                        onClick={() => {
                          setSort(option.value);
                          setOpenMenu(null);
                        }}
                      >
                        <span>{option.label}</span>
                        {selected && <Check size={14} strokeWidth={2.5} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="collection-grid-toggle" role="group" aria-label="Grid density">
              <button
                type="button"
                className={`collection-grid-btn${grid === "default" ? " is-active" : ""}`}
                aria-pressed={grid === "default"}
                aria-label="Comfortable grid — 4 items per row"
                onClick={() => setGrid("default")}
              >
                <Grid2x2 size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`collection-grid-btn${grid === "compact" ? " is-active" : ""}`}
                aria-pressed={grid === "compact"}
                aria-label="Compact grid — 6 items per row"
                onClick={() => setGrid("compact")}
              >
                <Grid3x3 size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="collection-chips" aria-label="Active filters">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="collection-chip"
                onClick={chip.onRemove}
              >
                {chip.label}
                <X size={13} strokeWidth={2} aria-hidden="true" />
              </button>
            ))}
            <button type="button" className="collection-clear-all" onClick={clearFilters}>
              Clear all
            </button>
          </div>
        )}

        {/* Grid — same card size and rhythm everywhere. */}
        <div
          className={`collection-grid${grid === "compact" ? " collection-grid--compact" : ""}`}
          aria-live="polite"
        >
          {visible.map((product, index) => (
            <CollectionProductCard
              key={product.id}
              product={product}
              eager={index < 8}
            />
          ))}
        </div>

        {visible.length === 0 && (
          <div className="collection-empty" role="status">
            <p className="collection-empty-title">No items match your filters</p>
            <p className="collection-empty-copy">
              Try selecting both availability options or clear the filters to see the full collection.
            </p>
            <button type="button" className="btn btn-primary" onClick={clearFilters}>
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
