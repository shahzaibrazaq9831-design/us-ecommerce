import type { Metadata } from "next";
import ListingHeader from "@/components/ListingHeader";
import ProductGrid from "@/components/ProductGrid";
import { getSaleProducts } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sale",
  description:
    "Every piece currently reduced — bridal, wedding, formal and chiffon designs at their offer price, with free worldwide shipping.",
  path: "/sale",
});

export default function SalePage() {
  const products = getSaleProducts();
  const saving = products.reduce((total, product) => {
    return total + (product.originalPrice ?? product.price) - product.price;
  }, 0);

  return (
    <section className="section">
      <div className="container">
        <ListingHeader
          eyebrow="Reduced this week"
          title="Sale"
          intro="Everything on this page is priced below its regular ticket. The price you see is the price you pay — no codes to remember, no minimum order."
          count={products.length}
        />

        {products.length > 0 ? (
          <p className="listing-note">
            You are saving {saving.toLocaleString("en-GB")} PKR across {products.length}{" "}
            {products.length === 1 ? "piece" : "pieces"} before shipping.
          </p>
        ) : null}

        <ProductGrid
          products={products}
          emptyText="The sale shelf is empty right now — please check back shortly."
        />
      </div>
    </section>
  );
}
