import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/products";

interface ProductGridProps {
  products: Product[];
  /** Shown when the filter returns nothing. */
  emptyText?: string;
}

/**
 * The product grid used by every listing page (shop, categories, occasions,
 * designers, best sellers, new arrivals and sale). It always renders the
 * products it is given — the filtering happens in the catalogue, not here.
 */
export default function ProductGrid({ products, emptyText }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="listing-empty" role="status">
        {emptyText ?? "Nothing here yet — please check back soon."}
      </p>
    );
  }

  return (
    <div className="products-grid">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
