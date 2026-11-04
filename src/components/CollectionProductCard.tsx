"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { toCartProduct, type NewArrivalProduct } from "@/data/newArrivals";

interface CollectionProductCardProps {
  product: NewArrivalProduct;
  /** Loading hint for the first row so the grid feels instant. */
  eager?: boolean;
}

/**
 * Product card for collection grids: 2:3 photo, Sale badge on the top-right
 * (when on sale), two-image hover crossfade on desktop, tap arrows on phones,
 * and a "Choose" button that opens the shared quick-view / cart modal.
 */
export default function CollectionProductCard({
  product,
  eager = false,
}: CollectionProductCardProps) {
  const { formatPrice } = useCurrency();
  const { openQuickView } = useCart();
  // The collection grid uses the first two gallery shots only.
  const images = product.images.slice(0, 2);
  const [index, setIndex] = useState(0);
  const total = images.length;
  const soldOut = product.availability === "out_of_stock";
  const onSale = product.originalPrice !== null;

  const showPrevious = () => setIndex((current) => (current - 1 + total) % total);
  const showNext = () => setIndex((current) => (current + 1) % total);

  const open = useCallback(() => {
    openQuickView(toCartProduct(product));
  }, [openQuickView, product]);

  const href = `/products/new-arrival-${product.slug}`;

  return (
    <article className={`gallery-card collection-card${soldOut ? " is-sold-out" : ""}`}>
      <div className="gallery-card-media">
        <Link
          href={href}
          className="gallery-card-link collection-card-image-btn"
          aria-label={`View ${product.name}`}
        >
          {images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={`${product.name}${i > 0 ? " — view 2" : ""}`}
              fill
              sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 17vw"
              className={`gallery-card-image${
                i > 0 ? " gallery-card-image--alt" : ""
              }${index === i ? " is-active" : ""}`}
              draggable={false}
              loading={eager ? "eager" : "lazy"}
            />
          ))}
        </Link>

        {soldOut && <span className="collection-card-soldout">Out of stock</span>}
        {onSale && <span className="gallery-card-badge">Sale</span>}

        {/* Gallery arrows — phones/touch only; desktop uses hover crossfade. */}
        <button
          type="button"
          className="gallery-card-arrow gallery-card-arrow--prev"
          onClick={showPrevious}
          aria-label={`Previous photo of ${product.name}`}
        >
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="gallery-card-arrow gallery-card-arrow--next"
          onClick={showNext}
          aria-label={`Next photo of ${product.name}`}
        >
          <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="collection-card-choose"
          onClick={open}
          disabled={soldOut}
          aria-label={soldOut ? `${product.name} is out of stock` : `Choose ${product.name}`}
        >
          {soldOut ? (
            "Sold out"
          ) : (
            <>
              <ShoppingBag size={14} strokeWidth={1.75} aria-hidden="true" />
              Choose
            </>
          )}
        </button>
      </div>

      <div className="gallery-card-info">
        <Link href={href} className="gallery-card-name collection-card-name">
          {product.name}
        </Link>
        <div className="gallery-card-price">
          <span className="gallery-card-price-current">{formatPrice(product.price)}</span>
          {product.originalPrice !== null && (
            <span className="gallery-card-price-old">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
