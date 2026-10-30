import Link from "next/link";
import Image from "next/image";
import HeroSlider from "@/components/HeroSlider";
import TrustGrid from "@/components/TrustGrid";
import OccasionCarousel from "@/components/OccasionCarousel";
import ProductRail from "@/components/ProductRail";
import Reveal from "@/components/Reveal";
import NewsletterForm from "@/components/NewsletterForm";
import ReviewsSection from "@/components/ReviewsSection";
import {
  newArrivalProducts,
  luxuryFormalProducts,
  bestSellingProducts,
} from "@/data/collections";
import { categories, reviews, gallery } from "@/data/site";

export default function HomePage() {
  return (
    <>
      <HeroSlider />

      {/* Compact trust grid (phones only) */}
      <TrustGrid />

      {/* Features Bar */}
      <section className="features-bar">
        <div className="container">
          <div className="features-grid">
            <Link href="/shipping" className="feature-item">
              <div className="feature-icon">
                <i className="fas fa-shipping-fast" />
              </div>
              <div className="feature-text">
                <h4>Worldwide Shipping</h4>
                <p>Free standard delivery to destinations available at checkout.</p>
              </div>
            </Link>
            <Link href="/returns" className="feature-item">
              <div className="feature-icon">
                <i className="fas fa-undo-alt" />
              </div>
              <div className="feature-text">
                <h4>Clear Returns Process</h4>
                <p>7-day returns on eligible unstitched dresses, including sale items.</p>
              </div>
            </Link>
            <Link href="/product" className="feature-item">
              <div className="feature-icon">
                <i className="fas fa-ruler-combined" />
              </div>
              <div className="feature-text">
                <h4>Made-to-Order Stitching</h4>
                <p>Choose a standard size or tailoring to your measurements.</p>
              </div>
            </Link>
            <Link href="/contact" className="feature-item">
              <div className="feature-icon">
                <i className="fas fa-headset" />
              </div>
              <div className="feature-text">
                <h4>Personal Customer Support</h4>
                <p>Help with sizing, product details and orders by email or WhatsApp.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Shop by Occasion */}
      <Reveal>
        <OccasionCarousel />
      </Reveal>

      {/* New Arrivals */}
      <Reveal>
        <ProductRail
          id="new-arrivals"
          title="New Arrivals"
          viewAllHref="/shop"
          products={newArrivalProducts}
        />
      </Reveal>

      {/* Luxury Formals */}
      <Reveal>
        <ProductRail
          id="luxury-formals"
          title="Luxury Formals"
          viewAllHref="/shop"
          products={luxuryFormalProducts}
        />
      </Reveal>

      {/* Best Sellers */}
      <Reveal>
        <ProductRail
          id="best-selling"
          title="Best Selling"
          viewAllHref="/shop"
          products={bestSellingProducts}
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
                <Link key={cat.name} href={cat.href} className="category-card">
                  <div className="category-image">
                    <Image src={cat.image} alt={cat.name} fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: "cover" }} />
                  </div>
                  <div className="category-overlay">
                    <h3>{cat.name}</h3>
                    <span className="category-count">{cat.count} Products</span>
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
              <p className="section-subtitle">@premiumpakistanidresses</p>
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

      {/* Newsletter */}
      <Reveal>
        <section className="section newsletter-section">
          <div className="container">
            <div className="newsletter-content">
              <h2>Subscribe to New Arrivals</h2>
              <p>
                Be first to discover new arrivals, bridal launches and restocks. Subscribe and receive code <strong>PPD10</strong> for 10% off your first prepaid order.
              </p>
              <NewsletterForm />
              <p className="newsletter-note">By subscribing you agree to receive up to two marketing emails a month. Unsubscribe anytime.</p>
            </div>
          </div>
        </section>
      </Reveal>
    </>
  );
}
