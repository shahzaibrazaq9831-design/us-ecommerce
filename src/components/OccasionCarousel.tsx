import ProductRail from "@/components/ProductRail";
import { occasionProducts } from "@/data/collections";

/**
 * Home-page "Shop by Occasion" rail. The occasion photos keep their original
 * order and now carry the matching product name, price and Sale badge.
 */
export default function OccasionCarousel() {
  return (
    <ProductRail
      id="shop-by-occasion"
      title="Shop by Occasion"
      subtitle="Find your look for the ceremony, the celebration and every gathering in between."
      products={occasionProducts}
      variant="occasion"
    />
  );
}
