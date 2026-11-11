import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingHeader from "@/components/ListingHeader";
import ProductGrid from "@/components/ProductGrid";
import {
  categories,
  getCategoryBySlug,
  getProductsByCategory,
  type CategorySlug,
} from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

/** Prerender the four shelves we know about; anything else is a 404. */
export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return pageMetadata({
      title: "Category not found",
      description: "This category is not part of the collection.",
      path: `/categories/${slug}`,
      noIndex: true,
    });
  }

  const count = getProductsByCategory(category.slug).length;

  return pageMetadata({
    title: `${category.name} — ${count} pieces`,
    description: `${category.description} Browse ${count} ${
      count === 1 ? "piece" : "pieces"
    } in our ${category.name.toLowerCase()} collection, available unstitched, standard or made to your measurements.`,
    path: category.href,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const products = getProductsByCategory(category.slug as CategorySlug);

  return (
    <section className="section">
      <div className="container">
        <ListingHeader
          eyebrow="Shop by category"
          title={category.name}
          intro={category.description}
          count={products.length}
        />
        <ProductGrid
          products={products}
          emptyText={`We are restocking ${category.name.toLowerCase()} — please check back shortly.`}
        />
      </div>
    </section>
  );
}
