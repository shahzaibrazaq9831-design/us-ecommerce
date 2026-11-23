"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Zap } from "lucide-react";
import { useCart, type CartSelection } from "@/context/CartContext";
import { useProductRating } from "@/components/ProductRatingsProvider";
import Price from "@/components/Price";
import StitchingSelector, {
  emptySelection,
  type StitchingSelection,
} from "@/components/StitchingSelector";
import {
  measurementsFromValues,
  validateMeasurements,
  type Product,
} from "@/lib/products";

/** The quick view body is keyed by slug, so each piece starts with fresh choices. */
function QuickViewBody({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const router = useRouter();
  const { addToCart, setBuyNow, openCart, toggleWishlist, isWishlisted } = useCart();
  const rating = useProductRating(product.slug);

  const [selection, setSelection] = useState<StitchingSelection>(() => ({
    ...emptySelection(),
    stitching: product.stitching.includes("standard")
      ? "standard"
      : (product.stitching[0] ?? "standard"),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const wishlisted = isWishlisted(product.slug);
  const soldOut = product.availability === "out_of_stock";

  const changeSelection = (next: StitchingSelection) => {
    setSelection(next);
    setErrors({});
  };

  /** The choices to save with the cart line, or null when something is missing. */
  const buildSelection = (): CartSelection | null => {
    const nextErrors: Record<string, string> = {};

    if (!product.stitching.includes(selection.stitching)) {
      nextErrors.stitching = "That way of making this piece is not available.";
    }

    if (selection.stitching === "standard" && !selection.size) {
      nextErrors.size = "Please choose a size.";
    }

    if (selection.stitching === "custom") {
      const result = validateMeasurements(selection.measurements, selection.unit);
      if (!result.valid) {
        for (const [key, message] of Object.entries(result.errors)) {
          nextErrors[key] = message ?? "";
        }
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return null;

    const chosen: CartSelection = {
      stitching: selection.stitching,
      notes: selection.notes.trim() || undefined,
    };
    if (selection.stitching === "standard") chosen.size = selection.size;
    if (selection.stitching === "custom") {
      chosen.measurements = measurementsFromValues(
        selection.measurements,
        selection.unit
      );
    }
    return chosen;
  };

  const handleAddToCart = () => {
    if (soldOut) return;
    const chosen = buildSelection();
    if (!chosen) return;
    addToCart(product, chosen);
    onClose();
    openCart();
  };

  const handleBuyNow = () => {
    if (soldOut) return;
    const chosen = buildSelection();
    if (!chosen) return;
    setBuyNow(product, chosen);
    onClose();
    // The query string selects this one-line order; the line itself lives in
    // the same persistent store as the cart, so a refresh keeps it.
    router.push("/checkout?buyNow=1");
  };

  return (
    <div className="modal active">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <i className="fas fa-times" />
        </button>
        <div className="modal-body">
          <div className="quick-view-grid">
            <div className="quick-view-image" style={{ position: "relative", aspectRatio: "3/4" }}>
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="quick-view-info">
              <span className="product-category">{product.category}</span>
              <h2>{product.name}</h2>
              {rating && (
                <div
                  className="review-stars"
                  style={{ color: "var(--color-gold)", display: "flex", gap: "4px", marginBottom: "12px" }}
                  aria-label={`Rated ${rating.average} out of 5 from ${rating.count} reviews`}
                >
                  {"★".repeat(Math.round(rating.average))}
                  {"☆".repeat(5 - Math.round(rating.average))}
                  <span style={{ color: "var(--color-gray-600)", fontSize: "0.85rem", marginLeft: "6px" }}>
                    ({rating.count})
                  </span>
                </div>
              )}
              <Price
                value={product.price}
                compareAt={product.originalPrice}
                className="product-price"
                style={{ marginBottom: "16px" }}
                valueClassName="price-current"
                compareAtClassName="price-original"
              />
              <p style={{ color: "var(--color-gray-700)", marginBottom: "20px", lineHeight: "1.7" }}>
                {product.description}
              </p>

              <StitchingSelector
                product={product}
                value={selection}
                onChange={changeSelection}
                errors={errors}
              />

              <div className="quick-view-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddToCart}
                  disabled={soldOut}
                >
                  <ShoppingBag size={17} strokeWidth={1.75} aria-hidden="true" />
                  {soldOut ? "Sold Out" : "Add to Cart"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleBuyNow}
                  disabled={soldOut}
                >
                  <Zap size={17} strokeWidth={1.75} aria-hidden="true" />
                  Buy Now
                </button>
              </div>

              <div className="quick-view-secondary">
                <button
                  className={`btn btn-outline${wishlisted ? " active" : ""}`}
                  onClick={() => toggleWishlist(product.slug)}
                >
                  <i className={wishlisted ? "fas fa-heart" : "far fa-heart"} />
                  {wishlisted ? "In Wishlist" : "Add to Wishlist"}
                </button>
                <Link href={`/products/${product.slug}`} className="btn btn-outline" onClick={onClose}>
                  View Full Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuickViewModal() {
  const { quickView, closeQuickView } = useCart();

  if (!quickView) return null;

  return (
    <QuickViewBody key={quickView.slug} product={quickView} onClose={closeQuickView} />
  );
}
