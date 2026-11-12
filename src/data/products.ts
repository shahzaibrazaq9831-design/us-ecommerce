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
  stitchingOptions,
  stitchingOptionCopy,
  standardSizes,
  measurementFields,
  measurementLimits,
  validateMeasurements,
  measurementsFromValues,
  summariseRatings,
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_BYTES,
  MAX_REVIEW_LENGTH,
  MIN_REVIEW_LENGTH,
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
  MeasurementKey,
  MeasurementUnit,
  MeasurementValues,
  MeasurementValidation,
  Measurements,
  ProductRatingSummary,
  Review,
  ReviewStatus,
} from "@/lib/products";
