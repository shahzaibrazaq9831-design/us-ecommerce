import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFeaturedDetailSlugs, getDetailProductBySlug } from "@/data/catalog";
import { getRelatedProducts } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import ProductBuyPanel from "@/components/ProductBuyPanel";

export function generateStaticParams() {
  // The full catalog also resolves on demand (ISR) — see catalog.ts.
  return getFeaturedDetailSlugs().map((slug) => ({ slug }));
}

async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getDetailProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = getRelatedProducts(product.slug);

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
          <ProductBuyPanel product={product} />
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
      </div>
    </section>
  );
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="section"><div className="container">Loading...</div></div>}>
      <ProductPage params={params} />
    </Suspense>
  );
}
