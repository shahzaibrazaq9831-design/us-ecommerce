import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { getOccasionCounts, occasions } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Shop by Occasion",
  description:
    "Barat, mehndi, nikkah, walima, mayun, dholki, engagement and Eid — find the pieces made for every celebration of the season.",
  path: "/collections",
});

export default function CollectionsPage() {
  const counts = getOccasionCounts();

  return (
    <section className="section">
      <div className="container">
        <div className="section-header listing-header">
          <span className="listing-eyebrow">Occasions</span>
          <h1 className="section-title">Shop by Occasion</h1>
          <p className="section-subtitle">
            Start with the celebration you are dressing for. Every shelf below is filled
            from the same catalogue, so what you see is what we actually stock.
          </p>
        </div>

        <div
          className="categories-grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}
        >
          {occasions.map((occasion) => (
            <Reveal key={occasion.slug}>
              <Link href={occasion.href} className="category-card">
                <div className="category-image" style={{ position: "relative" }}>
                  <Image
                    src={occasion.image}
                    alt={occasion.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="category-overlay">
                  <h3>{occasion.name}</h3>
                  <span className="category-count">
                    {counts[occasion.slug] ?? 0} {counts[occasion.slug] === 1 ? "piece" : "pieces"}
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
