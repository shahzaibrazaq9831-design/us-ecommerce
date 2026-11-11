import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ListingHeader from "@/components/ListingHeader";
import ProductGrid from "@/components/ProductGrid";
import {
  brands,
  getBrandBySlug,
  getProductsByBrand,
  type BrandSlug,
} from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return brands.map((brand) => ({ slug: brand.slug }));
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);

  if (!brand) {
    return pageMetadata({
      title: "Designer not found",
      description: "This designer house is not part of the collection.",
      path: `/brands/${slug}`,
      noIndex: true,
    });
  }

  const count = getProductsByBrand(brand.slug).length;

  return pageMetadata({
    title: `${brand.name} — Designer Collection`,
    description: `${brand.description} Browse ${count} ${
      count === 1 ? "piece" : "pieces"
    } from ${brand.name}.`,
    path: brand.href,
  });
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);

  if (!brand) {
    notFound();
  }

  const products = getProductsByBrand(brand.slug as BrandSlug);

  return (
    <section className="section">
      <div className="container">
        <ListingHeader
          eyebrow="Designer"
          title={brand.name}
          intro={brand.description}
          count={products.length}
        />
        <ProductGrid
          products={products}
          emptyText={`${brand.name} is between collections right now — please check back shortly.`}
        />
      </div>
    </section>
  );
}
