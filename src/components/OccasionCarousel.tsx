import ProductRail from "@/components/ProductRail";
import type { CollectionProduct } from "@/data/collections";

/**
 * Home-page "Shop by Occasion" rail. The occasion photos keep their original
 * order and show only the small SHOP label and the celebration name — prices
 * belong on the collection pages, not on these tiles.
 */
export default function OccasionCarousel({
  products,
}: {
  products: CollectionProduct[];
}) {
  return (
    <ProductRail
      id="shop-by-occasion"
      title="Shop by Occasion"
      subtitle="Find your look for the ceremony, the celebration and every gathering in between."
      products={products}
      variant="occasion"
    />
  );
}
