"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ProductRatingSummary } from "@/lib/products";

interface ProductRatingsValue {
  /** The real rating of each piece that has approved reviews. */
  ratings: Record<string, ProductRatingSummary>;
  /** True once the ratings have been fetched. */
  ready: boolean;
}

const ProductRatingsContext = createContext<ProductRatingsValue>({
  ratings: {},
  ready: false,
});

/**
 * Loads the real ratings once and shares them with every product card.
 *
 * The ratings come from the approved reviews only — a piece nobody has
 * reviewed yet has no rating, and the cards show nothing rather than an
 * invented number.
 */
export function ProductRatingsProvider({ children }: { children: ReactNode }) {
  const [ratings, setRatings] = useState<Record<string, ProductRatingSummary>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/product-ratings", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          ratings?: Record<string, ProductRatingSummary>;
        };
        if (cancelled) return;
        setRatings(data.ratings ?? {});
      } catch {
        // Offline or blocked — the cards simply show no rating.
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProductRatingsContext.Provider value={{ ratings, ready }}>
      {children}
    </ProductRatingsContext.Provider>
  );
}

/** The real rating of a piece, or null when it has no approved reviews. */
export function useProductRating(slug: string): ProductRatingSummary | null {
  const { ratings } = useContext(ProductRatingsContext);
  const rating = ratings[slug];
  if (!rating || rating.count === 0) return null;
  return rating;
}

/** Every rating, for pages that sort by rating. */
export function useProductRatings(): Record<string, ProductRatingSummary> {
  const { ratings } = useContext(ProductRatingsContext);
  return ratings;
}
