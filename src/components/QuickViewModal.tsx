"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";

export default function QuickViewModal() {
  const { quickView, closeQuickView, addToCart, openQuickView, toggleWishlist, isWishlisted } = useCart();
  const { formatPrice } = useCurrency();

  if (!quickView) return null;

  const wishlisted = isWishlisted(quickView.slug);

  return (
    <div className="modal active">
      <div className="modal-overlay" onClick={closeQuickView} />
      <div className="modal-content">
        <button className="modal-close" onClick={closeQuickView} aria-label="Close">
          <i className="fas fa-times" />
        </button>
        <div className="modal-body">
          <div className="quick-view-grid">
            <div className="quick-view-image" style={{ position: "relative", aspectRatio: "3/4" }}>
              <Image src={quickView.image} alt={quickView.name} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: "cover" }} />
            </div>
            <div className="quick-view-info">
              <span className="product-category">{quickView.category}</span>
              <h2>{quickView.name}</h2>
              <div className="review-stars" style={{ color: "var(--color-gold)", display: "flex", gap: "4px", marginBottom: "12px" }}>
                {"★".repeat(Math.round(quickView.rating))}
                {"☆".repeat(5 - Math.round(quickView.rating))}
                <span style={{ color: "var(--color-gray-600)", fontSize: "0.85rem", marginLeft: "6px" }}>({quickView.reviews})</span>
              </div>
              <div className="product-price" style={{ marginBottom: "16px" }}>
                <span className="price-current">{formatPrice(quickView.price)}</span>
                {quickView.originalPrice !== null ? <span className="price-original">{formatPrice(quickView.originalPrice)}</span> : null}
              </div>
              <p style={{ color: "var(--color-gray-700)", marginBottom: "20px", lineHeight: "1.7" }}>{quickView.description}</p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
                <button className="btn btn-primary" onClick={() => { addToCart(quickView); closeQuickView(); }}>
                  <i className="fas fa-shopping-bag" /> Add to Cart
                </button>
                <button className={`btn btn-outline${wishlisted ? " active" : ""}`} onClick={() => toggleWishlist(quickView.slug)}>
                  <i className={wishlisted ? "fas fa-heart" : "far fa-heart"} /> {wishlisted ? "In Wishlist" : "Add to Wishlist"}
                </button>
              </div>
              <Link href={`/products/${quickView.slug}`} className="btn btn-outline" onClick={closeQuickView} style={{ display: "inline-flex" }}>
                View Full Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
