import type { Metadata } from "next";
import NewArrivalsView from "@/components/NewArrivalsView";
import { getNewArrivals } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "New Arrivals",
  description:
    "The newest additions to the catalogue. Filter by availability, sort by price, rating or date, and pick the stitching that suits you.",
  path: "/new-arrivals",
});

export default function NewArrivalsPage() {
  // Counted from the catalogue so the page never promises a piece we do not have.
  const count = getNewArrivals().length;

  return (
    <>
      <NewArrivalsView />
      <p className="sr-only" aria-live="polite">
        {count} new arrivals in the catalogue.
      </p>
    </>
  );
}
