import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getFeaturedDetailSlugs, getDetailProductBySlug } from "@/data/catalog";
import { getRelatedProducts, getBrandBySlug, getStitchingLabel } from "@/lib/products";
import { getRatingSummary } from "@/lib/reviews";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import ProductBuyPanel from "@/components/ProductBuyPanel";
import ProductReviewSection from "@/components/ProductReviewSection";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  // The full catalog also resolves on demand (ISR) — see catalog.ts.
  return getFeaturedDetailSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getDetailProductBySlug(slug);

  if (!product) {
    return pageMetadata({
      title: "Piece not found",
      description: "This design is not in the catalogue any more.",
      path: `/products/${slug}`,
      noIndex: true,
    });
  }

  return pageMetadata({
    title: `${product.name} — ${product.categoryLabel}`,
    description: `${product.description} Available ${getStitchingLabel(
      product
    ).toLowerCase()}, with worldwide shipping.`,
    path: `/products/${product.slug}`,
    image: absoluteUrl(product.image),
  });
}

async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getDetailProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = getRelatedProducts(product.slug);
  const brand = getBrandBySlug(product.brand);

  // The rating comes from the approved reviews only. A piece nobody has
  // reviewed has no rating, so none is published.
  const rating = await getRatingSummary(product.slug);

  // Product structured data — tells search engines what this piece is
  // and what it costs.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((image) => absoluteUrl(image)),
    description: product.description,
    sku: product.sku,
    category: product.categoryLabel,
    brand: {
      "@type": "Brand",
      name: brand?.name ?? product.brand,
    },
    material: "Silk blend, chiffon and hand-finished embroidery",
    ...(rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.average,
            reviewCount: rating.count,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "PKR",
      price: product.price,
      availability:
        product.availability === "in_stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Rung E Bahar",
      },
    },
  };

  return (
    <section className="section">
      <div className="container">
        <div style={{ marginBottom: "24px" }}>
          <Link href="/shop" style={{ color: "var(--color-gray-600)" }}>
            ← Back to Shop
          </Link>
        </div>
        <div className="buy-grid">
          <ProductGallery images={product.images} name={product.name} badge={product.badge} />
          <ProductBuyPanel product={product} rating={rating} />
        </div>

        {related.length > 0 && (
          <div style={{ marginTop: "60px" }}>
            <div className="section-header" style={{ textAlign: "left" }}>
              <h2 className="section-title" style={{ fontSize: "2rem" }}>
                You May Also Like
              </h2>
            </div>
            <div className="products-grid">
              {related.map((r) => (
                <ProductCard key={r.slug} product={r} />
              ))}
            </div>
          </div>
        )}

        <ProductReviewSection product={product} />
      </div>

      <script
        type="application/ld+json"
        // Static, serialisable payload built from the catalogue — safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </section>
  );
}

export default function Page({ params }: ProductPageProps) {
  return (
    <Suspense fallback={<div className="section"><div className="container">Loading...</div></div>}>
      <ProductPage params={params} />
    </Suspense>
  );
}
