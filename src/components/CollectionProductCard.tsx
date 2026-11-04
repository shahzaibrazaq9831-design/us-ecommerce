"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
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
 * (when on sale), gallery arrows on hover/touch, and a "Choose" button that
 * opens the shared quick-view / cart modal.
 */
export default function CollectionProductCard({
  product,
  eager = false,
}: CollectionProductCardProps) {
  const { formatPrice } = useCurrency();
  const { openQuickView } = useCart();
  const [index, setIndex] = useState(0);
  const total = product.images.length;
  const soldOut = product.availability === "out_of_stock";
  const onSale = product.originalPrice !== null;

  const showPrevious = () => setIndex((current) => (current - 1 + total) % total);
  const showNext = () => setIndex((current) => (current + 1) % total);

  const open = useCallback(() => {
    openQuickView(toCartProduct(product));
  }, [openQuickView, product]);

  return (
    <article className={`gallery-card collection-card${soldOut ? " is-sold-out" : ""}`}>
      <div className="gallery-card-media">
        <button
          type="button"
          className="gallery-card-link collection-card-image-btn"
          onClick={open}
          aria-label={`View ${product.name}`}
        >
          <Image
            key={product.images[index]}
            src={product.images[index]}
            alt={`${product.name}${index > 0 ? ` — view ${index + 1}` : ""}`}
            fill
            sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 17vw"
            className="gallery-card-image"
            draggable={false}
            loading={eager ? "eager" : "lazy"}
          />
        </button>

        {soldOut && <span className="collection-card-soldout">Out of stock</span>}
        {onSale && <span className="gallery-card-badge">Sale</span>}

        {/* Gallery arrows — hover on desktop, always visible on touch. */}
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
        <button type="button" className="gallery-card-name collection-card-name" onClick={open}>
          {product.name}
        </button>
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
