import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingHeader from "@/components/ListingHeader";
import ProductGrid from "@/components/ProductGrid";
import {
  getOccasionBySlug,
  getProductsByOccasion,
  occasions,
  type OccasionSlug,
} from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

/** Prerender the eight celebrations; anything else is a 404. */
export function generateStaticParams() {
  return occasions.map((occasion) => ({ slug: occasion.slug }));
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const occasion = getOccasionBySlug(slug);

  if (!occasion) {
    return pageMetadata({
      title: "Collection not found",
      description: "This celebration is not part of the collection.",
      path: `/collections/${slug}`,
      noIndex: true,
    });
  }

  const count = getProductsByOccasion(occasion.slug).length;

  return pageMetadata({
    title: `${occasion.name} Collection`,
    description: `${occasion.description} Shop ${count} ${
      count === 1 ? "piece" : "pieces"
    } from our ${occasion.name.toLowerCase()} collection.`,
    path: occasion.href,
  });
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const occasion = getOccasionBySlug(slug);

  if (!occasion) {
    notFound();
  }

  const products = getProductsByOccasion(occasion.slug as OccasionSlug);

  return (
    <section className="section">
      <div className="container">
        <ListingHeader
          eyebrow="Shop by occasion"
          title={occasion.name}
          intro={occasion.description}
          count={products.length}
        />
        <ProductGrid
          products={products}
          emptyText={`We are preparing our ${occasion.name.toLowerCase()} edit — please check back shortly.`}
        />
      </div>
    </section>
  );
}
