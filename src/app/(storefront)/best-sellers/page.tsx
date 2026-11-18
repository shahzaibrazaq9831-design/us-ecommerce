import type { Metadata } from "next";
import ListingHeader from "@/components/ListingHeader";
import ProductGrid from "@/components/ProductGrid";
import { getBestSellers } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Best Sellers",
  description:
    "The pieces our customers keep coming back for — our most ordered dresses, restocked and ready to stitch to your size.",
  path: "/best-sellers",
});

export default function BestSellersPage() {
  const products = getBestSellers();

  return (
    <section className="section">
      <div className="container">
        <ListingHeader
          eyebrow="Most ordered"
          title="Best Sellers"
          intro="These are the designs that keep selling out — the ones people photograph, ask about by name and come back for in a second colour."
          count={products.length}
        />
        <ProductGrid
          products={products}
          emptyText="Our best sellers are being restocked — please check back shortly."
        />
      </div>
    </section>
  );
}
