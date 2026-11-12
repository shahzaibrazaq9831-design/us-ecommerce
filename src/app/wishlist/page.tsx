"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { getProductBySlug, getStitchingLabel } from "@/lib/products";

/**
 * The wishlist.
 *
 * The list lives in the browser, so it is still there after a reload and
 * on the next visit. Pieces can be added from any card and removed from
 * here or from the card itself.
 */
export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const { formatPrice } = useCurrency();

  const items = wishlist
    .map((slug) => getProductBySlug(slug))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container cart-empty">
          <Heart size={40} strokeWidth={1.2} aria-hidden="true" />
          <h1 className="section-title">My Wishlist</h1>
          <p style={{ color: "var(--color-gray-600)", marginBottom: "24px" }}>
            Your wishlist is empty
          </p>
          <Link href="/shop" className="btn btn-primary">
            Discover Products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ textAlign: "left" }}>
          <h1 className="section-title">My Wishlist</h1>
          <p className="section-subtitle">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>

        <ul className="wishlist-items">
          {items.map((product) => {
            const soldOut = product.availability === "out_of_stock";

            return (
              <li key={product.slug} className="wishlist-item">
                <Link
                  href={`/products/${product.slug}`}
                  className="wishlist-item-image"
                  aria-label={`View ${product.name}`}
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="140px"
                    style={{ objectFit: "cover" }}
                  />
                </Link>

                <div className="wishlist-item-body">
                  <span className="product-category">{product.categoryLabel}</span>
                  <Link href={`/products/${product.slug}`} className="wishlist-item-name">
                    {product.name}
                  </Link>
                  <p className="wishlist-item-stitching">{getStitchingLabel(product)}</p>
                  <div className="product-price">
                    <span className="price-current">{formatPrice(product.price)}</span>
                    {product.originalPrice !== null && (
                      <span className="price-original">{formatPrice(product.originalPrice)}</span>
                    )}
                  </div>
                </div>

                <div className="wishlist-item-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => addToCart(product)}
                    disabled={soldOut}
                  >
                    <ShoppingBag size={16} strokeWidth={1.8} aria-hidden="true" />
                    {soldOut ? "Sold Out" : "Add to Cart"}
                  </button>
                  <button
                    type="button"
                    className="wishlist-item-remove"
                    onClick={() => toggleWishlist(product.slug)}
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    <Heart size={15} strokeWidth={1.8} aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
