import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import HeroSlider from "@/components/HeroSlider";
import FeaturesSection from "@/components/FeaturesSection";
import OccasionCarousel from "@/components/OccasionCarousel";
import ProductRail from "@/components/ProductRail";
import Reveal from "@/components/Reveal";
import ReviewsSection from "@/components/ReviewsSection";
import {
  newArrivalProducts,
  luxuryFormalProducts,
  bestSellingProducts,
} from "@/data/collections";
import { categories, getCategoryCounts } from "@/lib/products";
import { reviews, gallery } from "@/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Premium Pakistani Dresses | Designer-Inspired Collection",
  description:
    "Bridal, wedding, formal and chiffon dresses made to order. Free worldwide shipping, three stitching options and a size guide for every piece.",
  path: "/",
});

export default function HomePage() {
  // Shelf counts come from the catalogue, so the home page can never
  // advertise more pieces than the shop actually holds.
  const categoryCounts = getCategoryCounts();

  return (
    <>
      <HeroSlider />

      {/* Why shop with us — 4-item trust bar */}
      <FeaturesSection />

      {/* Shop by Occasion */}
      <Reveal>
        <OccasionCarousel />
      </Reveal>

      {/* New Arrivals — all 8 shown in a grid, 2 per row on phones */}
      <Reveal>
        <ProductRail
          id="new-arrivals"
          title="New Arrivals"
          viewAllHref="/new-arrivals"
          products={newArrivalProducts}
          layout="grid"
          ctaLabel="View All New Arrivals"
        />
      </Reveal>

      {/* Luxury Formals — horizontal rail with mouse drag + arrows */}
      <Reveal>
        <ProductRail
          id="luxury-formals"
          title="Luxury Formals"
          viewAllHref="/categories/formals"
          products={luxuryFormalProducts}
          layout="rail"
          ctaLabel="Visit All Luxury Formals"
        />
      </Reveal>

      {/* Best Selling — horizontal rail with mouse drag + arrows */}
      <Reveal>
        <ProductRail
          id="best-selling"
          title="Best Selling"
          viewAllHref="/best-sellers"
          products={bestSellingProducts}
          layout="rail"
          ctaLabel="Visit Best Selling"
        />
      </Reveal>

      {/* Categories */}
      <Reveal>
        <section className="section categories-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Shop by Category</h2>
            </div>
            <div className="categories-grid">
              {categories.map((cat) => (
                <Link key={cat.slug} href={cat.href} className="category-card">
                  <div className="category-image">
                    <Image src={cat.image} alt={cat.name} fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: "cover" }} />
                  </div>
                  <div className="category-overlay">
                    <h3>{cat.name}</h3>
                    <span className="category-count">
                      {categoryCounts[cat.slug] ?? 0}{" "}
                      {categoryCounts[cat.slug] === 1 ? "Product" : "Products"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Reviews */}
      <ReviewsSection reviews={reviews} />

      {/* Instagram */}
      <Reveal>
        <section className="section instagram-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Follow Our Style</h2>
              <p className="section-subtitle">@rungebahar</p>
            </div>
            <div className="instagram-grid">
              {gallery.map((src) => (
                <a key={src} href="https://www.instagram.com/premium.pakistani.dresses/" target="_blank" rel="noopener noreferrer" className="instagram-item">
                  <Image src={src} alt="Style" fill sizes="(max-width: 768px) 33vw, 16vw" style={{ objectFit: "cover" }} />
                  <div className="instagram-overlay">
                    <i className="fab fa-instagram" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
    </>
  );
}
