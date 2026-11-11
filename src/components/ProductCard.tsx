"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
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

        {/* Star rating and how many reviews it is based on */}
        <p
          className="product-rating"
          aria-label={`Rated ${product.rating} out of 5 from ${product.reviews} reviews`}
        >
          <span className="product-stars" aria-hidden="true">
            {"★".repeat(Math.round(product.rating))}
            {"☆".repeat(5 - Math.round(product.rating))}
          </span>
          <span className="product-rating-count">
            {product.rating} ({product.reviews})
          </span>
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
