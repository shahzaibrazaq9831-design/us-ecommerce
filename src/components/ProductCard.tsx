"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { type Product } from "@/data/products";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWishlisted, openQuickView } = useCart();
  const { formatPrice } = useCurrency();
  const wishlisted = isWishlisted(product.slug);

  return (
    <article className="product-card">
      <div className="product-image">
        <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: "cover" }} />
        {product.badge && (
          <span className={`product-badge badge-${product.badge}`}>{product.badge.toUpperCase()}</span>
        )}
        <div className="product-actions">
          <button
            className={`product-action-btn${wishlisted ? " active" : ""}`}
            onClick={() => toggleWishlist(product.slug)}
            aria-label="Toggle wishlist"
          >
            <i className={wishlisted ? "fas fa-heart" : "far fa-heart"} />
          </button>
          <button
            className="product-action-btn"
            onClick={() => openQuickView(product)}
            aria-label="Quick view"
          >
            <i className="far fa-eye" />
          </button>
          <button
            className="product-action-btn"
            onClick={() => addToCart(product)}
            aria-label="Add to cart"
          >
            <i className="fas fa-shopping-bag" />
          </button>
        </div>
      </div>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <Link href={`/products/${product.slug}`}>
          <h3 className="product-name">{product.name}</h3>
        </Link>
        <div className="product-price">
          <span className="price-current">{formatPrice(product.price)}</span>
          {product.originalPrice !== null && (
            <span className="price-original">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
