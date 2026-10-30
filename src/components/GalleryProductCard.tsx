"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import type { CollectionProduct } from "@/data/collections";

interface GalleryProductCardProps {
  product: CollectionProduct;
  /** First visible card can load eagerly for a faster LCP. */
  eager?: boolean;
}

/**
 * Product card matching the reference storefront:
 * 2:3 photo, white "Sale" pill on the top-right, name below, current price and
 * a grey struck-through compare-at price. Extra photos are reachable through
 * the arrows over the image (shown on hover / always on touch screens).
 */
export default function GalleryProductCard({
  product,
  eager = false,
}: GalleryProductCardProps) {
  const { formatPrice } = useCurrency();
  const [index, setIndex] = useState(0);
  const total = product.images.length;
  const hasGallery = total > 1;

  const showPrevious = () => setIndex((current) => (current - 1 + total) % total);
  const showNext = () => setIndex((current) => (current + 1) % total);

  return (
    <article className="gallery-card">
      <div className="gallery-card-media">
        <Link
          href={product.href}
          className="gallery-card-link"
          aria-label={
            product.label ? `${product.label}: ${product.name}` : product.name
          }
        >
          <Image
            key={product.images[index]}
            src={product.images[index]}
            alt={`${product.name}${index > 0 ? ` — view ${index + 1}` : ""}`}
            fill
            sizes="(max-width: 767px) 46vw, (max-width: 1023px) 31vw, 23vw"
            className="gallery-card-image"
            draggable={false}
            loading={eager ? "eager" : "lazy"}
          />
        </Link>

        <span className="gallery-card-badge">Sale</span>

        {hasGallery && (
          <>
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
          </>
        )}
      </div>

      <div className="gallery-card-info">
        {product.label && (
          <span className="gallery-card-label">{product.label}</span>
        )}
        <Link href={product.href} className="gallery-card-name">
          {product.name}
        </Link>
        <div className="gallery-card-price">
          <span className="gallery-card-price-current">
            {formatPrice(product.price)}
          </span>
          <span className="gallery-card-price-old">
            {formatPrice(product.originalPrice)}
          </span>
        </div>
      </div>
    </article>
  );
}
