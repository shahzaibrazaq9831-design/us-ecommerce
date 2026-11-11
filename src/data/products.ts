/**
 * Product data — thin re-export of the catalogue.
 *
 * The catalogue itself lives in `@/lib/products` so the whole site reads
 * product data from one module. This file stays here so older imports
 * (`@/data/products`) keep working without a rename.
 */

export {
  products,
  getProductBySlug,
  getRelatedProducts,
  getProductsByCategory,
  getProductsByOccasion,
  getProductsByBrand,
  getProductsBySlugs,
  getNewArrivals,
  getBestSellers,
  getSaleProducts,
  getCategoryCounts,
  getOccasionCounts,
  getBrandCounts,
  getDiscountPercent,
  getCardBadge,
  getStitchingLabel,
  getAllProductSlugs,
  categories,
  occasions,
  brands,
  luxuryFormalShelf,
  stitchingLabels,
} from "@/lib/products";

export type {
  Product,
  Badge,
  StitchingOption,
  CategorySlug,
  OccasionSlug,
  BrandSlug,
  Availability,
  Category,
  Occasion,
  Brand,
  CardBadge,
} from "@/lib/products";
