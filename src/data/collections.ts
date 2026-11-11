/**
 * Home-page product rails — every rail is derived from the single catalogue
 * in `@/lib/products`, so a rail can never show a piece the shop does not
 * stock, and the counts always match.
 *
 * Prices are stored in PKR (the store base currency) and converted at display
 * time by CurrencyContext. Every card keeps its own gallery in the same order
 * as the product page; `images[0]` is the card's main image.
 *
 * `slug` links the card to its product (buy) page at `/products/<slug>`.
 */

import {
  getBestSellers,
  getNewArrivals,
  getProductBySlug,
  getProductsBySlugs,
  luxuryFormalShelf,
  occasions,
  type Product,
} from "@/lib/products";

export interface CollectionProduct {
  /** Unique key for the rail. */
  id: string;
  /** Product-page slug. */
  slug: string;
  name: string;
  /** Small optional line above the name (used by the occasion rail). */
  label?: string;
  images: string[];
  /** Current selling price in PKR. */
  price: number;
  /** Compare-at price in PKR (shown grey + struck through), or null. */
  originalPrice: number | null;
  href: string;
}

const href = (slug: string) => `/products/${slug}`;

/** Turn a catalogue product into a rail card. */
const toCollectionProduct = (product: Product): CollectionProduct => ({
  id: product.slug,
  slug: product.slug,
  name: product.name,
  images: product.images,
  price: product.price,
  originalPrice: product.originalPrice,
  href: href(product.slug),
});

/**
 * Shop by Occasion — the eight occasion photos paired with the piece that
 * leads each celebration.
 */
export const occasionProducts: CollectionProduct[] = occasions
  .map((occasion): CollectionProduct | null => {
    const product = getProductBySlug(occasion.featuredSlug);
    if (!product) return null;

    return {
      id: occasion.slug,
      slug: product.slug,
      label: occasion.name,
      name: product.name,
      // The lookbook photo leads, the product gallery follows.
      images: [occasion.photo, ...product.images.slice(1)],
      price: product.price,
      originalPrice: product.originalPrice,
      href: occasion.href,
    };
  })
  .filter((entry): entry is CollectionProduct => entry !== null);

/** New Arrivals — the freshest pieces in the catalogue. */
export const newArrivalProducts: CollectionProduct[] = getNewArrivals().map(toCollectionProduct);

/** Luxury Formals — a curated shelf of our heaviest formal pieces. */
export const luxuryFormalProducts: CollectionProduct[] = getProductsBySlugs(
  luxuryFormalShelf
).map(toCollectionProduct);

/** Best Selling — the pieces that keep getting ordered. */
export const bestSellingProducts: CollectionProduct[] = getBestSellers().map(toCollectionProduct);
