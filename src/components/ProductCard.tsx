"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useProductRating } from "@/components/ProductRatingsProvider";
import {
  getCardBadge,
  getStitchingLabel,
  type Product,
} from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWishlisted, openQuickView } = useCart();
  const { formatPrice } = useCurrency();
  const wishlisted = isWishlisted(product.slug);
  const badge = getCardBadge(product);
  const soldOut = product.availability === "out_of_stock";
  // The rating is the real one, from the approved reviews only. A piece
  // nobody has reviewed yet shows no stars at all.
  const rating = useProductRating(product.slug);

  return (
    <article className="product-card">
      <div className="product-image">
        <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`} style={{ position: "absolute", inset: 0 }}>
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: "cover" }} />
        </Link>
        {badge && (
          <span className={`product-badge badge-${badge.kind}`}>{badge.label}</span>
        )}
        {soldOut && <span className="product-badge badge-soldout">Sold Out</span>}
        <div className="product-actions">
          <button
            className={`product-action-btn${wishlisted ? " active" : ""}`}
            onClick={() => toggleWishlist(product.slug)}
            aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          >
            <i className={wishlisted ? "fas fa-heart" : "far fa-heart"} />
          </button>
          <button
            className="product-action-btn"
            onClick={() => openQuickView(product)}
            aria-label={`Quick view of ${product.name}`}
          >
            <i className="far fa-eye" />
          </button>
          <button
            className="product-action-btn"
            onClick={() => addToCart(product)}
            aria-label={`Add ${product.name} to cart`}
          >
            <i className="fas fa-shopping-bag" />
          </button>
        </div>
      </div>
      <div className="product-info">
        <span className="product-category">{product.categoryLabel}</span>
        <Link href={`/products/${product.slug}`}>
          <h3 className="product-name">{product.name}</h3>
        </Link>

        {/* Star rating and how many reviews it is based on. The row keeps
            its height even when there is no rating, so the card never
            jumps once the ratings arrive. */}
        <p
          className="product-rating"
          aria-label={
            rating
              ? `Rated ${rating.average} out of 5 from ${rating.count} reviews`
              : undefined
          }
        >
          {rating ? (
            <>
              <span className="product-stars" aria-hidden="true">
                {"★".repeat(Math.round(rating.average))}
                {"☆".repeat(5 - Math.round(rating.average))}
              </span>
              <span className="product-rating-count">
                {rating.average} ({rating.count})
              </span>
            </>
          ) : null}
        </p>

        <div className="product-price">
          <span className="price-current">{formatPrice(product.price)}</span>
          {product.originalPrice !== null && (
            <span className="price-original">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        {/* How the piece can be made — unstitched, standard or to your measurements */}
        <p className="product-stitching">{getStitchingLabel(product)}</p>
      </div>
    </article>
  );
}
