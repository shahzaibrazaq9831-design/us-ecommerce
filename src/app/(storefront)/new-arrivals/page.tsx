import type { Metadata } from "next";
import NewArrivalsView from "@/components/NewArrivalsView";
import { buildNewArrivalsCatalog } from "@/data/newArrivals";
import { pageMetadata } from "@/lib/seo";
import { getStorefrontProducts } from "@/lib/storefront-catalog";

export const metadata: Metadata = pageMetadata({
  title: "New Arrivals",
  description:
    "The newest additions to the catalogue. Filter by availability, sort by price, rating or date, and pick the stitching that suits you.",
  path: "/new-arrivals",
});

export default async function NewArrivalsPage() {
  const catalog = await getStorefrontProducts();
  const items = buildNewArrivalsCatalog(catalog);

  return (
    <>
      <NewArrivalsView products={items} />
      <p className="sr-only" aria-live="polite">
        {items.length} new arrivals in the catalogue.
      </p>
    </>
  );
}
