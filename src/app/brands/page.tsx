import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { brands, getBrandCounts, getProductsByBrand } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Designers",
  description:
    "The designer houses behind our collection. Open a house to see every piece they made for us, with prices and availability.",
  path: "/brands",
});

export default function BrandsPage() {
  const counts = getBrandCounts();

  return (
    <section className="section">
      <div className="container">
        <div className="section-header listing-header">
          <span className="listing-eyebrow">Designers</span>
          <h1 className="section-title">The Houses We Work With</h1>
          <p className="section-subtitle">
            Every piece in the catalogue comes from one of these houses. Open a house to
            see what they made for us this season.
          </p>
        </div>

        <div className="brand-grid">
          {brands.map((brand) => {
            const count = counts[brand.slug] ?? 0;
            const cover = getProductsByBrand(brand.slug)[0];

            return (
              <Link key={brand.slug} href={brand.href} className="brand-card">
                <div className="brand-card-image">
                  {cover ? (
                    <Image
                      src={cover.image}
                      alt={brand.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : null}
                </div>
                <div className="brand-card-body">
                  <h2 className="brand-card-name">{brand.name}</h2>
                  <p className="brand-card-copy">{brand.description}</p>
                  <span className="brand-card-count">
                    {count} {count === 1 ? "piece" : "pieces"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
