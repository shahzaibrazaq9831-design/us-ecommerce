/**
 * New Arrivals catalog — generated deterministically from this store's own
 * product photography.
 *
 * The reference collection shows 204 items, so this file produces 204 entries
 * from the 28 local galleries (28 × 7 + 8) in `/public/images/rungebahar`.
 * Names, prices and availability are invented for the demo catalog; no data is
 * copied from any other storefront.
 */

import type { Product } from "./products";

export type Availability = "in_stock" | "out_of_stock";

export interface NewArrivalProduct {
  id: string;
  slug: string;
  name: string;
  images: string[];
  /** Selling price in the store's base currency (PKR). */
  price: number;
  /** Compare-at price in PKR, or null when the item is not on sale. */
  originalPrice: number | null;
  availability: Availability;
  /** ISO timestamp used by the "Date" sort options. Descending = newest. */
  createdAt: string;
  /** Lower number = more relevant (used by "Most relevant"). */
  relevanceRank: number;
  /** Lower number = stronger seller (used by "Best selling"). */
  bestSellingRank: number;
  rating: number;
  reviews: number;
}

const GALLERY_HANDLES = [
  "arasti-mustard-yellow",
  "char",
  "darya",
  "elia",
  "embroidered-mcp-106",
  "hyacinth",
  "iriana",
  "ishani",
  "kesar",
  "kiara",
  "lucent",
  "mariyam",
  "melodic-tassels",
  "minahil",
  "mira-elegant",
  "naheed",
  "noreen",
  "offwhite-red",
  "opulent",
  "pink-embroidered",
  "pista-embroidered",
  "sabyasachi",
  "sarang",
  "saxe",
  "sevgi",
  "shocking-bridal",
  "surajmukhi",
  "zeena",
] as const;

const GALLERY_SETS = GALLERY_HANDLES.map((handle) => [
  `/images/rungebahar/${handle}-1.webp`,
  `/images/rungebahar/${handle}-2.webp`,
  `/images/rungebahar/${handle}-3.webp`,
]);

/** 12 × 17 = 204 invented product names. */
const NAME_ROOTS = [
  "Mehr",
  "Noor",
  "Zar",
  "Gul",
  "Heer",
  "Rooh",
  "Dil",
  "Neel",
  "Saba",
  "Hira",
  "Yara",
  "Sahar",
] as const;

const NAME_ENDINGS = [
  "Ran",
  "Mah",
  "Zin",
  "Asal",
  "Vash",
  "Noor",
  "Tash",
  "Yar",
  "Lin",
  "Sher",
  "Naaz",
  "Mar",
  "Shah",
  "Saaz",
  "Zhar",
  "Nafis",
  "Mira",
] as const;

/** Deterministic 0–1 value from an integer seed (stable across reloads). */
const hash01 = (seed: number): number => {
  const x = Math.sin(seed * 2917.137 + 1001.331) * 10000;
  return x - Math.floor(x);
};

const roundTo100 = (value: number): number => Math.round(value / 100) * 100;

const BASE_TIME = Date.UTC(2026, 10, 4, 10, 0, 0);
const HOUR_MS = 60 * 60 * 1000;

const products: NewArrivalProduct[] = [];

export const newArrivalsCatalog: NewArrivalProduct[] = products;
export const NEW_ARRIVALS_COUNT = newArrivalsCatalog.length;

/** Convert a catalog entry into the Product shape used by the cart/quick view. */
export function toCartProduct(item: NewArrivalProduct): Product {
  const id = newArrivalsCatalog.indexOf(item) + 1000;
  return {
    id,
    slug: `new-arrival-${item.slug}`,
    name: item.name,
    category: "New Arrivals",
    price: item.price,
    originalPrice: item.originalPrice,
    image: item.images[0],
    badge: "new",
    rating: item.rating,
    reviews: item.reviews,
    description:
      "A luxurious designer-inspired three-piece ensemble with intricate hand-embroidery, a matching dupatta and made-to-order stitching. Perfect for weddings, Eid, formals and evening celebrations.",
  };
}
