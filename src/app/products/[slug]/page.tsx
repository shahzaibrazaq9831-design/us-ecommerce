import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { products, getProductBySlug, getRelatedProducts } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import Price from "@/components/Price";
import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px", marginBottom: "60px" }}>
          <div style={{ position: "relative", aspectRatio: "3/4", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: "cover" }} />
            {product.badge && (
              <span className={`product-badge badge-${product.badge}`} style={{ position: "absolute", top: "16px", left: "16px" }}>
                {product.badge.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <span className="product-category">{product.category}</span>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem, 4vw, 2.8rem)", margin: "8px 0 16px" }}>{product.name}</h1>
            <div className="review-stars" style={{ color: "var(--color-gold)", display: "flex", gap: "4px", marginBottom: "16px" }}>
              {"★".repeat(Math.round(product.rating))}
              {"☆".repeat(5 - Math.round(product.rating))}
              <span style={{ color: "var(--color-gray-600)", fontSize: "0.9rem", marginLeft: "8px" }}>
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>
            <div className="product-price" style={{ marginBottom: "20px" }}>
              <Price value={product.price} className="price-current" style={{ fontSize: "1.6rem" }} />
              {product.originalPrice !== null && (
                <Price value={product.originalPrice} className="price-original" style={{ fontSize: "1.2rem" }} />
              )}
            </div>
            <p style={{ color: "var(--color-gray-700)", lineHeight: "1.8", marginBottom: "24px" }}>{product.description}</p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
              <AddToCartButton product={product} />
              <WishlistButton slug={product.slug} />
            </div>
            <div style={{ background: "var(--color-cream)", padding: "16px", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontWeight: 600, marginBottom: "8px" }}>Product Details</div>
              <ul style={{ color: "var(--color-gray-700)", display: "grid", gap: "6px" }}>
                <li>• Category: {product.category}</li>
                <li>• Made-to-order stitching available</li>
                <li>• Worldwide shipping</li>
                <li>• 7-day returns on eligible items</li>
              </ul>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div>
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
