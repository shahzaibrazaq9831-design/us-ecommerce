import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import { occasions, occasionDescriptions } from "@/data/site";

export default function CollectionsPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <h1 className="section-title">Shop by Occasion</h1>
          <p className="section-subtitle">Explore our curated collections for every ceremony and celebration.</p>
        </div>
        <div className="categories-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
          {occasions.map((o) => (
            <Reveal key={o.name}>
              <Link href="/shop" className="category-card">
                <div className="category-image" style={{ position: "relative" }}>
                  <Image src={o.image} alt={o.name} fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: "cover" }} />
                </div>
                <div className="category-overlay">
                  <h3>{o.name}</h3>
                  <span className="category-count">{occasionDescriptions[o.name] || "Explore collection"}</span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
