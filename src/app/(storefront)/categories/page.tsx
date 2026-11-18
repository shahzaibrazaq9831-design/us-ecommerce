import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { categories, getCategoryCounts } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Shop by Category",
  description:
    "Bridal, wedding, formal and chiffon dresses — browse the collection by the kind of occasion you are dressing for.",
  path: "/categories",
});

export default function CategoriesPage() {
  const counts = getCategoryCounts();

  return (
    <section className="section">
      <div className="container">
        <div className="section-header listing-header">
          <span className="listing-eyebrow">Categories</span>
          <h1 className="section-title">Shop by Category</h1>
          <p className="section-subtitle">
            Four shelves, each one stocked from the same catalogue. Pick a shelf and
            you will see every piece we have in it.
          </p>
        </div>

        <div className="categories-grid">
          {categories.map((category) => (
            <Link key={category.slug} href={category.href} className="category-card">
              <div className="category-image">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="category-overlay">
                <h3>{category.name}</h3>
                <span className="category-count">
                  {counts[category.slug] ?? 0} {counts[category.slug] === 1 ? "Product" : "Products"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
